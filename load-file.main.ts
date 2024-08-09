import Papa from "papaparse";
import fs from "fs";
import { DateTime } from "luxon";
import { getDBConnection } from "./db";
import { parseAmount } from "./scraperUtils";

/**
 * This script loads a csv file containg spending data in gov.uk/HMRC format
 * into the `spend_transactions` table in a SQLite database.
 *
 * Some basic validation is performed.
 */

// Common data format of _some_ of the spend files.
// Might have to support other formats in the future but this is ok for HMRC & DfT
type GovUKData = {
  "Department family": string;
  Entity: string;
  Date: string;
  "Expense type": string;
  "Expense area": string;
  Supplier: string;
  "Transaction number": string;
  Amount: string;
  Description: string;
  "Supplier Postcode": string;
};

// Corresponds to the spend_transactions table in the database
type SpendTransaction = {
  buyer_name: string;
  supplier_name: string;
  amount: number;
  transaction_timestamp: string; // should be iso format
};

export const loadFile = async(csvPath: string) => {
  console.log(`Reading ${csvPath}.`);
  const csvContent = fs.readFileSync(csvPath, { encoding: "utf8" });
  const csvData = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true, // some files have empty newlines at the end
  });

  console.log(`Read ${csvData.data.length} transactions.`);
  console.debug(`First row: ${JSON.stringify(csvData.data[0])}`);

  const knexDb = await getDBConnection();

  const knexTableName = "spend_transactions"

  let rowNum = 1;
  let batch: SpendTransaction[] = []
  const problematicRows: {row: {[key: string]: any}, issue: string}[] = []
  const bulkSize = Number(process.env.SQL_BATCH_SIZE || 100)
  for (const row of csvData.data) {
    try {
      // Add more validation in the future?
      const spendDataRow = row as GovUKData;

      // Some files have hundreds of rows with no data at the end, just commas.
      // It's safe to skip these.
      if (spendDataRow.Entity === "") {
        continue;
      }

      // Added parsing from ISO that includes many strings and separate handling for localized numeric date
      const dateString = spendDataRow["Date"]
      let combinedTsp: string | null
      const isoTsp = DateTime.fromISO(
        dateString
      ).toISO();

      const localisedTsp = DateTime.fromFormat(
        dateString,
        "dd/MM/yyyy"
      ).toISO();

      const literalMonthTsp = DateTime.fromFormat(
        dateString,
        "dd-MMM-yyyy"
      ).toISO();

      combinedTsp = isoTsp || localisedTsp || literalMonthTsp
      if (!combinedTsp) {
        problematicRows.push({
          row: spendDataRow,
          issue:`Invalid transaction timestamp ${dateString}.` 
        })
        continue
      }
      if (batch.length === bulkSize) {
          await knexDb.batchInsert(knexTableName, batch)
          batch = []
      }

      batch.push({
          buyer_name: spendDataRow['Entity'],
          supplier_name: spendDataRow['Supplier'],
          amount: parseAmount(spendDataRow['Amount']),
          transaction_timestamp: combinedTsp
      })


      ++rowNum;
    } catch (e) {
      console.error(`Failed while processing batch, current rows number:${rowNum}, current row: ${JSON.stringify(row)}`)
      throw e;
    }
  }


  if (batch.length === bulkSize) {
      try {
          await knexDb.batchInsert(knexTableName, batch)
          batch = []
      } catch (err) {
          console.error(
              `Failed while processing last batch`
          )
          throw err
      }
  }

  if (problematicRows.length) {
      console.error(
          `There were ${
              problematicRows.length
          } rows that failed while processing, thise were their errors: ${JSON.stringify(
              problematicRows.map((e) => e.issue)
          )}`
      )
  }

  console.log("Finished writing to the DB.");
  await knexDb.destroy();
}