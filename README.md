# Stotles Backend Enginer work sample assignment

## Problem statement

All the instructions are available [here](https://www.notion.so/stotles/Backend-engineer-work-sample-assignment-15b1dd4d10d3430a8735cd3b2f12ade7).

### Summary of requirements

See the instructions (linked above) for warm-up task and full problem statement.

The core requirements are:

1. Fix the failing test so that we can correctly parse transaction amounts.
2. `fetch-transaction-data` should load all files published since 2020 from the following links:
    1. https://www.gov.uk/government/collections/spending-over-25-000
    2. https://www.gov.uk/government/collections/dft-departmental-spending-over-25000
3. A new API `/api/top_suppliers` should accept a POST request containing (optional) buyer name and time range (from/to timestamps in ISO format) and return an object containing an array supplier names & total values

    Sample request:

    ```tsx
    {
       "buyer_name": "HMRC",
       "from_date": "20210101",
       "to_date": "20210131",
    }
    ```

    or:

    ```tsx
    {
       "from_date": "20210101",
       "to_date": "20210131",
    }
    ```

    Sample response:

    ```tsx
    {
       "top_suppliers": [
          { "name": "Stotles", "total_amount": 1234567.0 }
       ]
    }
    ```

4. In the README file, please make a note of the result of the query for HMRC for all transactions in 2021.

## Code structure

The codebase is composed of:

-   `load-file.main.ts` - script used to load a single CSV file from disk
-   `fetch-transaction-data.main.ts` - script used to fetch data from gov.uk API
-   `query-service.main.ts` - HTTP API server for querying the data

Some shared code has been extracted to other files - `db.ts` & `scraperUtils.ts` -
feel free to refactor the code more if needed.

### Libraries

The code makes use of the following libraries:

-   expressjs - [documentation](https://expressjs.com/)
-   knex - [documentation](https://knexjs.org/)
-   luxon - [documentation](https://moment.github.io/luxon/)

## Getting started

You can run `ts-node` to execute each of these or use scripts defined in package.json:

```bash
# Starts the query service with --watch so it auto-reloads
npm run dev-query-service
# Runs the scraper
npm run dev-fetch-transaction-data
# Runs the file loader
npm run dev-load-file
```

The first time you run any script that accesses the db (calls `getDBConnection()`),
it will create db.sqlite3 file if it doesn't exist.

At any point you can delete that file and it will be recreated from scratch.

### Browsing the database

You should start by looking at the migration in `./migrations` folder.
If you prefer to browse the DB using SQL, you can use the sqlite command line (just run `sqlite3 ./db.sqlite3`)
or any other SQL client that supports sqlite.

If for any reason the database becomes unusable, you can just delete the db.sqlite3 file and it will be recreated (including running the migrations) next time you run any script.

### Disabling/Enabling TypeScript

If you prefer to completely disable TypeScript for a file, add `// @ts-nocheck` on the first line.
If you just want to disable strict type checking, modify `tsconfig.json` according to your needs.

# Candidate's notes

Changes:

-  Replaced existing Date parsing with two operations
   -   ISO parsing to keep the existing behavior and to be backwards compatible
   -   Localized numeric date parsing
     the used date will be the isom date if it succeeds and the localozed date if not
-  Added batching to the record inserting logic, default batch size is 100 and can de overriden using and env var SQL_BATCH_SIZE
-  Instead of throwing an error on each corrupted record I added an array to collect those and print after all of the others finish
-  Added 'numeral' to parse numbers including currencies
-  Added a file download util to the 'extracted_files' folder
-  Used a Regex to filter files from the year 2020, can be modified if needed but currently can be very permissive
-  Modified the load-file tile so it can be used by other files
-  Created a description map for both example links that is used as an instruction for the script
-  Added simple validation to the top_suppliers endpoint

As stated in the assignment, the result to this input:

```
{
   "buyer_name": "HMRC",
   "from_date": "20210101",
   "to_date": "20211231"
}
```

Will be this:

```
{
   "top_suppliers": [
      {
            "name": "CAPGEMINI",
            "total_value": 840149864.1200006
      },
      {
            "name": "FUJITSU SERVICES LTD",
            "total_value": 694094348.2999994
      },
      {
            "name": "RCDTS LTD",
            "total_value": 180115391.26000005
      },
      {
            "name": "MAPELEY STEPS CONTRACTOR LTD",
            "total_value": 149651189.32000008
      },
      {
            "name": "ACCENTURE (UK) LTD",
            "total_value": 132252241.24
      }
   ]
}
```

As for further validations, given some more time I would have added specific validations to each property of the date model.
 - We have some validations but those can be improved/extended
 - The data model can include more data if needed
 - I've noticed that amount can be negative, not sure if correct or not but can be worth some investigating/corrections
 - A good addition can be adding data formatting to the incoming data befor it is stored inn the DB

Some more changes I would have liked to do would be some more structural changes, folder structure, separating logic from the controller, separating the controller from the express server initialization etc.
