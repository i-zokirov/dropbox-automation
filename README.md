
# DropBox Automation

Multiple components of dropbox-automation project I have worked on for a client.




## Project tasks

Main goal of the application is to automatically place the name and date of the newly added files from the Dropbox platform to a GoogleSheet report.


Mode of operation:
 1. Connects to Dropbox.
 2. Displays a list of folders in Dropbox.
 3. The desired folders are selected.
 4. Finds .xls, .xlsx, .doc, .docx, jpg, pdf-like documents in the selected folders (even if the files are deeply nested) and copies its name and creation date.
 5. Connects to the desired googlesheet report and creates sheet tabs with the folder names from the dropbox platform if not already created.
 6. If found files are not present on the report sheet, appends the required details to the end of rows.




## Deployment

Components were deployed to Google Cloud Platform.

app-engine-default - is the component deployed on App Engine and is used to obtain DropBox authentication token and store in Secret Manager.

reportGenerator - is the main component which authenticates to DropBox using the generated token which is stored in the Secret Manager and processes the files from the DropBox platform and appends to the desired google sheets reports.




## License

[MIT](https://choosealicense.com/licenses/mit/)

Feel free to reuse, modify, distribute the code. Just don`t forget to leave ⭐️⭐️⭐️

