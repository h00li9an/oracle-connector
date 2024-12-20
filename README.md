# oracle-connector

This app will connect to an existing oracle database and download query output to a file.

#Create a folder called logs in the base directory (it is mounted in docker-compose)
# build and run the compose file
docker compose build && docker compose up -d

#The backend will run on port 3000
#Open the index.html file on a browser. Enter the oracle server/DB credentials and connection strings
connection string e.g.: server01-db.mssql.local:1522/HR.mssql.local or 10.10.10.10:1521/DB


#Enter the query to dowonlad. Setup a cron schedule to run the query on a scheduled basis. Set an output file. The query output will be saved in the Logs folder.
