# Create and manage spreadsheets

This document explains how to create and manage spreadsheets in Google Sheets
using the Google Sheets API.

## Create a spreadsheet

To create a file in Sheets, use the
[`create`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/create) method on the
[`spreadsheets`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets) resource
with no parameters.

When you create the file, the method returns a `spreadsheets` resource. The
returned resource contains a `spreadsheetId`, `properties`, a list of `sheets`,
and a `spreadsheetUrl`.

The following code sample shows how to create a blank spreadsheet with a
specified title.

### Apps Script

sheets/api/spreadsheet_snippets.gs [View on GitHub](https://github.com/googleworkspace/apps-script-samples/blob/main/sheets/api/spreadsheet_snippets.gs)

```javascript
/**
 * Creates a new sheet using the sheets advanced services
 * @param {string} title the name of the sheet to be created
 * @returns {string} the spreadsheet ID
 */
Snippets.prototype.create = (title) => {
  // This code uses the Sheets Advanced Service, but for most use cases
  // the built-in method SpreadsheetApp.create() is more appropriate.
  try {
    const sheet = Sheets.newSpreadsheet();
    sheet.properties = Sheets.newSpreadsheetProperties();
    sheet.properties.title = title;
    const spreadsheet = Sheets.Spreadsheets.create(sheet);

    return spreadsheet.spreadsheetId;
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log("Failed with error %s", err.message);
  }
};
```

### Java

sheets/snippets/src/main/java/Create.java [View on GitHub](https://github.com/googleworkspace/java-samples/blob/main/sheets/snippets/src/main/java/Create.java)

```java
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.Spreadsheet;
import com.google.api.services.sheets.v4.model.SpreadsheetProperties;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.util.Collections;

/* Class to demonstrate the use of Spreadsheet Create API */
public class Create {
  /**
   * Create a new spreadsheet.
   *
   * @param title - the name of the sheet to be created.
   * @return newly created spreadsheet id
   * @throws IOException - if credentials file not found.
   */
  public static String createSpreadsheet(String title) throws IOException {
        /* Load pre-authorized user credentials from the environment.
           TODO(developer) - See https://developers.google.com/identity for
            guides on implementing OAuth2 for your application. */
    GoogleCredentials credentials = GoogleCredentials.getApplicationDefault()
        .createScoped(Collections.singleton(SheetsScopes.SPREADSHEETS));
    HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(
        credentials);

    // Create the sheets API client
    Sheets service = new Sheets.Builder(new NetHttpTransport(),
        GsonFactory.getDefaultInstance(),
        requestInitializer)
        .setApplicationName("Sheets samples")
        .build();

    // Create new spreadsheet with a title
    Spreadsheet spreadsheet = new Spreadsheet()
        .setProperties(new SpreadsheetProperties()
            .setTitle(title));
    spreadsheet = service.spreadsheets().create(spreadsheet)
        .setFields("spreadsheetId")
        .execute();
    // Prints the new spreadsheet id
    System.out.println("Spreadsheet ID: " + spreadsheet.getSpreadsheetId());
    return spreadsheet.getSpreadsheetId();
  }
}
```

### JavaScript

sheets/snippets/sheets_create.js [View on GitHub](https://github.com/googleworkspace/browser-samples/blob/main/sheets/snippets/sheets_create.js)

```javascript
function create(title, callback) {
  try {
    gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title,
      },
    }).then((response) => {
      if (callback) callback(response);
      console.log('Spreadsheet ID: ' + response.result.spreadsheetId);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}
```

### Node.js

sheets/snippets/sheets_create.js [View on GitHub](https://github.com/googleworkspace/node-samples/blob/main/sheets/snippets/sheets_create.js)

```javascript
import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

/**
 * Creates a new Google Spreadsheet.
 * @param {string} title The title of the new spreadsheet.
 * @return {string} The ID of the created spreadsheet.
 */
async function create(title) {
  // Authenticate with Google and get an authorized client.
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create a new Sheets API client.
  const service = google.sheets({version: 'v4', auth});

  // The resource body for creating a new spreadsheet.
  const resource = {
    properties: {
      title,
    },
  };

  // Create the new spreadsheet.
  const spreadsheet = await service.spreadsheets.create({
    resource,
    fields: 'spreadsheetId',
  });

  // Log the ID of the new spreadsheet.
  console.log(`Spreadsheet ID: ${spreadsheet.data.spreadsheetId}`);
  return spreadsheet.data.spreadsheetId;
}
```

### PHP

sheets/snippets/src/SpreadsheetCreate.php [View on GitHub](https://github.com/googleworkspace/php-samples/blob/main/sheets/snippets/src/SpreadsheetCreate.php)

```php
<?php
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets\SpreadSheet;

/**
* create an empty spreadsheet
* 
*/

 function create($title)
    {   
        /* Load pre-authorized user credentials from the environment.
           TODO(developer) - See https://developers.google.com/identity for
            guides on implementing OAuth2 for your application. */
        $client = new Google\Client();
        $client->useApplicationDefaultCredentials();
        $client->addScope(Google\Service\Drive::DRIVE);
        $service = new Google_Service_Sheets($client);
        try{

            $spreadsheet = new Google_Service_Sheets_Spreadsheet([
                'properties' => [
                    'title' => $title
                    ]
                ]);
                $spreadsheet = $service->spreadsheets->create($spreadsheet, [
                    'fields' => 'spreadsheetId'
                ]);
                printf("Spreadsheet ID: %s\n", $spreadsheet->spreadsheetId);
                return $spreadsheet->spreadsheetId;
        }
        catch(Exception $e) {
            // TODO(developer) - handle error appropriately
            echo 'Message: ' .$e->getMessage();
          }
    }
```

### Python

sheets/snippets/sheets_create.py [View on GitHub](https://github.com/googleworkspace/python-samples/blob/main/sheets/snippets/sheets_create.py)

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def create(title):
  """
  Creates the Sheet the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)
    spreadsheet = {"properties": {"title": title}}
    spreadsheet = (
        service.spreadsheets()
        .create(body=spreadsheet, fields="spreadsheetId")
        .execute()
    )
    print(f"Spreadsheet ID: {(spreadsheet.get('spreadsheetId'))}")
    return spreadsheet.get("spreadsheetId")
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: title
  create("mysheet1")
```

### Ruby

sheets/snippets/lib/spreadsheet_snippets.rb [View on GitHub](https://github.com/googleworkspace/ruby-samples/blob/main/sheets/snippets/lib/spreadsheet_snippets.rb)

```ruby
spreadsheet = {
  properties: {
    title: 'Sales Report'
  }
}
spreadsheet = service.create_spreadsheet(spreadsheet,
                                         fields: 'spreadsheetId')
puts "Spreadsheet ID: #{spreadsheet.spreadsheet_id}"
```

### Organize spreadsheets in Google Drive folders

By default, the created spreadsheet is saved to the user's root folder on
Google Drive.

If you want to save a spreadsheet to a specified Drive folder,
use these methods:

- After the spreadsheet file is created, move it to a specific folder using
  the [`update`](https://developers.google.com/drive/api/v3/reference/files/update) method on the
  [`files`](https://developers.google.com/drive/api/v3/reference/files) resource of Google Drive API. For more
  information, see [Move files between
  folders](https://developers.google.com/workspace/drive/api/guides/folder#move-files).

- Add a blank spreadsheet to a folder using the
  [`create`](https://developers.google.com/drive/api/v3/reference/files/create) method on the `files`
  resource of Drive API, specifying
  `application/vnd.google-apps.spreadsheet` as the
  [`mimeType`](https://developers.google.com/drive/api/v3/reference/files#File.FIELDS.mime_type). For more
  information on creating files, see [Create a file in a specific
  folder](https://developers.google.com/workspace/drive/api/guides/folder#create-file). For more
  information on MIME types, see [Google Workspace and Google Drive
  supported MIME types](https://developers.google.com/workspace/drive/api/guides/mime-types).

For either alternative, you'll need to add the appropriate [Drive
API
scopes](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create#authorization-scopes)
to authorize the call.

If your app is using a Service Account, the Service Account owns the created
spreadsheet. This file then resides in the Service Account's dedicated
Drive storage. Files don't appear within other
Drive storage accounts unless explicitly shared. For more
information, see [File
ownership](https://developers.google.com/workspace/drive/api/guides/create-file#file-ownership).

To move or create a file within a shared drive folder, refer to [Implement
shared drive support](https://developers.google.com/workspace/drive/api/guides/enable-shareddrives).

To learn more about cell and row limits in Google Sheets, see [Files you can
store in Google Drive](https://support.google.com/drive/answer/37603).

## Get a spreadsheet

To get a spreadsheet, use the
[`get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get) method on the
`spreadsheets` resource with the `spreadsheetId` path parameter.

The method returns the file as an instance of a `spreadsheets` resource. By
default, data within the spreadsheet isn't returned. The returned resource
contains the structure and metadata of the spreadsheet, including the
spreadsheet properties (such as title, locale, and time zone) and some detailed
sheet information (such as formatting and protected ranges).

To include data within a `spreadsheets` resource, use these two methods:

- Specify a [field mask](https://developers.google.com/workspace/sheets/api/guides/field-masks) listing
  your selected fields by setting the `fields` [system
  parameter](https://cloud.google.com/apis/docs/system-parameters#definitions).

- Set the boolean [`includeGridData`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get#body.QUERY_PARAMETERS.include_grid_data)
  query parameter to `true`. If a field mask is set, the `includeGridData`
  parameter is ignored.

When you're working with large spreadsheets, we recommend that you query for
only the specific spreadsheet fields that you need. The `get` method returns all
the data associated with the spreadsheet, so general queries for large
spreadsheets can be slow. For example, to read the number 100 from a cell,
`spreadsheets.get` returns the cell value plus metadata (such as font name,
size, etc.) resulting in large JSON payloads that are slow to parse. In
comparison, a similar call to `values.get` returns only the specific cell value
resulting in a much lighter, faster response.

For more information on the `spreadsheets.values` resource, including
[`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)
and
[`spreadsheets.values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet),
see the following documents:

- [Read and write cell values](https://developers.google.com/workspace/sheets/api/guides/values)
- [Basic reading](https://developers.google.com/workspace/sheets/api/samples/reading)

## List spreadsheets

The Sheets API doesn't offer a method to list spreadsheets for
authenticated users.

To retrieve a list of spreadsheets, you can use Drive API's
[`list`](https://developers.google.com/workspace/drive/v3/reference/files/list) method on the
[`files`](https://developers.google.com/workspace/drive/api/reference/rest/v3/files) resource, specifying
`application/vnd.google-apps.spreadsheet` as the
[`mimeType`](https://developers.google.com/drive/api/v3/reference/files#File.FIELDS.mime_type):

### HTTP

    GET https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'

### cURL

    curl -X GET "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     -H "Accept: application/json"

Replace <var translate="no">ACCESS_TOKEN</var> with the access token that grants
access to the API.

Using the `files.list` method to list a user's spreadsheets requires a
[restricted](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) Drive API
scope.

## Related topics

Here are a few next steps you might try:

- To update a spreadsheet, see [Update
  spreadsheets](https://developers.google.com/workspace/sheets/api/guides/batchupdate).

- To work with smart chips, see [Smart
  chips](https://developers.google.com/workspace/sheets/api/guides/chips).

- To work with developer metadata, see [Read, write, and search
  metadata](https://developers.google.com/workspace/sheets/api/guides/metadata).