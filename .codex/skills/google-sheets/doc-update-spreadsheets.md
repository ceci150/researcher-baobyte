# Read &amp; write cell values

Spreadsheets can have multiple sheets, with each sheet having any number of rows
or columns. A [cell](https://developers.google.com/workspace/sheets/api/guides/concepts#cell) is a location
at the intersection of a particular row and column, and might contain a data
value. The Google Sheets API provides the
[`spreadsheets.values`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)
resource to enable the reading and writing of values.

This page describes the basics of using the `spreadsheets.values` resource. If
you need to insert rows or update the formatting and other properties in a
sheet, you must use the
[`spreadsheets.batchUpdate`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate)
method described in [Update
spreadsheets](https://developers.google.com/workspace/sheets/api/guides/batchupdate).

## Methods

The
[`spreadsheets.values`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets)
resource provides the following methods for reading and writing values, each for
a specific task:

| Range Access | Reading | Writing |
|---|---|---|
| Single range | [`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get) | [`spreadsheets.values.update`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update) |
| Multiple ranges | [`spreadsheets.values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet) | [`spreadsheets.values.batchUpdate`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate) |
| Appending |   | [`spreadsheets.values.append`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append) |

In general, it's a good idea to combine multiple reads or updates with the
`batchGet` and `batchUpdate` methods (respectively), as this improves
efficiency.

You can find examples of each of these methods on the [Basic
reading](https://developers.google.com/workspace/sheets/api/samples/reading) and [Basic
writing](https://developers.google.com/workspace/sheets/api/samples/writing) samples pages. To see all
samples, refer to the [samples overview page](https://developers.google.com/workspace/sheets/api/samples).

## Read

To read data values from a sheet, you need the spreadsheet ID and the A1
notation for the range. Specifying the range without the sheet ID (`A1:B2`)
means that the request executes on the first sheet in the spreadsheet. For more
information about spreadsheet IDs and A1 notation, see [Google Sheets API
Overview](https://developers.google.com/workspace/sheets/api/guides/concepts).

Several optional query parameters control the format of the output:

| Format Parameter | Default Value |
|---|---|
| [`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#dimension) | ROWS |
| [`valueRenderOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueRenderOption) | FORMATTED_VALUE |
| [`dateTimeRenderOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/DateTimeRenderOption) | SERIAL_NUMBER |

Note that you should only use `dateTimeRenderOption` if the `valueRenderOption`
isn't `FORMATTED_VALUE`.

There's no explicit limit to the amount of data returned. Errors return no data.
Empty trailing rows and columns are omitted.

The singular and batch get methods are described below. For samples of basic
read operations, see [Basic reading](https://developers.google.com/workspace/sheets/api/samples/reading).

### Read a single range

To read a single range of values from a spreadsheet, use a
[`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)
request:

### Apps Script

sheets/api/spreadsheet_snippets.gs [View on GitHub](https://github.com/googleworkspace/apps-script-samples/blob/main/sheets/api/spreadsheet_snippets.gs)

```javascript
/**
 * Gets the values of the cells in the specified range
 * @param {string} spreadsheetId id of the spreadsheet
 * @param {string} range specifying the start and end cells of the range
 * @returns {*} Values in the range
 */
Snippets.prototype.getValues = (spreadsheetId, range) => {
  // This code uses the Sheets Advanced Service, but for most use cases
  // the built-in method SpreadsheetApp.getActiveSpreadsheet()
  //     .getRange(range).getValues(values) is more appropriate.
  try {
    const result = Sheets.Spreadsheets.Values.get(spreadsheetId, range);
    const numRows = result.values ? result.values.length : 0;
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log("Failed with error %s", err.message);
  }
};
```

### Java

sheets/snippets/src/main/java/GetValues.java [View on GitHub](https://github.com/googleworkspace/java-samples/blob/main/sheets/snippets/src/main/java/GetValues.java)

```java
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.util.Collections;

/* Class to demonstrate the use of Spreadsheet Get Values API */
public class GetValues {
  /**
   * Returns a range of values from a spreadsheet.
   *
   * @param spreadsheetId - Id of the spreadsheet.
   * @param range         - Range of cells of the spreadsheet.
   * @return Values in the range
   * @throws IOException - if credentials file not found.
   */
  public static ValueRange getValues(String spreadsheetId, String range) throws IOException {
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

    ValueRange result = null;
    try {
      // Gets the values of the cells in the specified range.
      result = service.spreadsheets().values().get(spreadsheetId, range).execute();
      int numRows = result.getValues() != null ? result.getValues().size() : 0;
      System.out.printf("%d rows retrieved.", numRows);
    } catch (GoogleJsonResponseException e) {
      // TODO(developer) - handle error appropriately
      GoogleJsonError error = e.getDetails();
      if (error.getCode() == 404) {
        System.out.printf("Spreadsheet not found with id '%s'.\n", spreadsheetId);
      } else {
        throw e;
      }
    }
    return result;
  }
}
```

### JavaScript

sheets/snippets/sheets_get_values.js [View on GitHub](https://github.com/googleworkspace/browser-samples/blob/main/sheets/snippets/sheets_get_values.js)

```javascript
function getValues(spreadsheetId, range, callback) {
  try {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    }).then((response) => {
      const result = response.result;
      const numRows = result.values ? result.values.length : 0;
      console.log(`${numRows} rows retrieved.`);
      if (callback) callback(response);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}
```

### Node.js

sheets/snippets/sheets_get_values.js [View on GitHub](https://github.com/googleworkspace/node-samples/blob/main/sheets/snippets/sheets_get_values.js)

```javascript
import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

/**
 * Gets cell values from a spreadsheet.
 * @param {string} spreadsheetId The ID of the spreadsheet.
 * @param {string} range The range of cells to retrieve.
 * @return {Promise<object>} The response from the get request.
 */
async function getValues(spreadsheetId, range) {
  // Authenticate with Google and get an authorized client.
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create a new Sheets API client.
  const service = google.sheets({version: 'v4', auth});
  // Get the values from the specified range.
  const result = await service.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const numRows = result.data.values ? result.data.values.length : 0;
  console.log(`${numRows} rows retrieved.`);
  return result;
}
```

### PHP

sheets/snippets/src/SpreadsheetGetValues.php [View on GitHub](https://github.com/googleworkspace/php-samples/blob/main/sheets/snippets/src/SpreadsheetGetValues.php)

```php
<?php
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets\BatchUpdateSpreadsheetRequest;
/**
 * get values of a particular spreadsheet(by Id and range).
 */
function getValues($spreadsheetId, $range)
    {   
        /* Load pre-authorized user credentials from the environment.
           TODO(developer) - See https://developers.google.com/identity for
            guides on implementing OAuth2 for your application. */
        $client = new Google\Client();
        $client->useApplicationDefaultCredentials();
        $client->addScope(Google\Service\Drive::DRIVE);
        $service = new Google_Service_Sheets($client);
        $result = $service->spreadsheets_values->get($spreadsheetId, $range);
        try{
        $numRows = $result->getValues() != null ? count($result->getValues()) : 0;
        printf("%d rows retrieved.", $numRows);
        return $result;
    }
        catch(Exception $e) {
            // TODO(developer) - handle error appropriately
            echo 'Message: ' .$e->getMessage();
        }
    }
```

### Python

sheets/snippets/sheets_get_values.py [View on GitHub](https://github.com/googleworkspace/python-samples/blob/main/sheets/snippets/sheets_get_values.py)

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def get_values(spreadsheet_id, range_name):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )
    rows = result.get("values", [])
    print(f"{len(rows)} rows retrieved")
    return result
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: spreadsheet_id, and range_name
  get_values("1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k", "A1:C2")
```

### Ruby

sheets/snippets/lib/spreadsheet_snippets.rb [View on GitHub](https://github.com/googleworkspace/ruby-samples/blob/main/sheets/snippets/lib/spreadsheet_snippets.rb)

```ruby
result = service.get_spreadsheet_values(spreadsheet_id, range_name)
num_rows = result.values ? result.values.length : 0
puts "#{num_rows} rows received."
```

The response to this request is returned as a
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource-valuerange)
object.

### Read multiple ranges

To read multiple, discontinuous ranges of values from a spreadsheet, use a
[`spreadsheets.values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet)
request that lets you specify several ranges to retrieve:

### Apps Script

sheets/api/spreadsheet_snippets.gs [View on GitHub](https://github.com/googleworkspace/apps-script-samples/blob/main/sheets/api/spreadsheet_snippets.gs)

```javascript
/**
 * Get the values in the specified ranges
 * @param {string} spreadsheetId spreadsheet's ID
 * @param {list<string>} _ranges The span of ranges
 * @returns {*} spreadsheet information and values
 */
Snippets.prototype.batchGetValues = (spreadsheetId, _ranges) => {
  // This code uses the Sheets Advanced Service, but for most use cases
  // the built-in method SpreadsheetApp.getActiveSpreadsheet()
  //     .getRange(range).getValues(values) is more appropriate.
  let ranges = [
    //Range names ...
  ];
  try {
    const result = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, {
      ranges: ranges,
    });
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log("Failed with error %s", err.message);
  }
};
```

### Java

sheets/snippets/src/main/java/BatchGetValues.java [View on GitHub](https://github.com/googleworkspace/java-samples/blob/main/sheets/snippets/src/main/java/BatchGetValues.java)

```java
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.BatchGetValuesResponse;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

/* Class to demonstrate the use of Spreadsheet Batch Get Values API */
public class BatchGetValues {
  /**
   * Returns one or more ranges of values from a spreadsheet.
   *
   * @param spreadsheetId - Id of the spreadsheet.
   * @param ranges        - Range of cells of the spreadsheet.
   * @return Values in the range
   * @throws IOException - if credentials file not found.
   */
  public static BatchGetValuesResponse batchGetValues(String spreadsheetId,
                                                      List<String> ranges)
      throws IOException {
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

    BatchGetValuesResponse result = null;
    try {
      // Gets the values of the cells in the specified range.
      result = service.spreadsheets().values().batchGet(spreadsheetId)
          .setRanges(ranges).execute();
      System.out.printf("%d ranges retrieved.", result.getValueRanges().size());
    } catch (GoogleJsonResponseException e) {
      // TODO(developer) - handle error appropriately
      GoogleJsonError error = e.getDetails();
      if (error.getCode() == 404) {
        System.out.printf("Spreadsheet not found with id '%s'.\n", spreadsheetId);
      } else {
        throw e;
      }
    }
    return result;
  }
}
```

### JavaScript

sheets/snippets/sheets_batch_get_values.js [View on GitHub](https://github.com/googleworkspace/browser-samples/blob/main/sheets/snippets/sheets_batch_get_values.js)

```javascript
function batchGetValues(spreadsheetId, _ranges, callback) {
  let ranges = [
    // Range names ...
  ];
  ranges = _ranges;
  try {
    gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: ranges,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.valueRanges.length} ranges retrieved.`);
      if (callback) callback(response);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}
```

### Node.js

sheets/snippets/sheets_batch_get_values.js [View on GitHub](https://github.com/googleworkspace/node-samples/blob/main/sheets/snippets/sheets_batch_get_values.js)

```javascript
import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

/**
 * Batch gets cell values from a spreadsheet.
 * @param {string} spreadsheetId The ID of the spreadsheet.
 * @param {string} _ranges The ranges of cells to retrieve.
 * @return {obj} The spreadsheet information.
 */
async function batchGetValues(spreadsheetId, _ranges) {
  // Authenticate with Google and get an authorized client.
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create a new Sheets API client.
  const service = google.sheets({version: 'v4', auth});

  // The ranges to retrieve from the spreadsheet.
  let ranges = [
    // e.g., 'Sheet1!A1:C5',
    // 'Sheet2!A1:B3'
  ];
```

### PHP

sheets/snippets/src/SpreadsheetBatchGetValues.php [View on GitHub](https://github.com/googleworkspace/php-samples/blob/main/sheets/snippets/src/SpreadsheetBatchGetValues.php)

```php
<?php

use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets;
/**
 * method to get a spreadsheet values in batch
 */

function batchGetValues($spreadsheetId)
    {
        /* Load pre-authorized user credentials from the environment.
        TODO(developer) - See https://developers.google.com/identity for
        guides on implementing OAuth2 for your application. */       
        $client = new Google\Client();
        $client->useApplicationDefaultCredentials();
        $client->addScope(Google\Service\Drive::DRIVE);
        $service = new Google_Service_Sheets($client);
        try{
            $ranges = 'Sheet1!A1:B2';
            $params = array(
                'ranges' => $ranges
            );
            //execute the request
            $result = $service->spreadsheets_values->batchGet($spreadsheetId, $params);
            printf("%d ranges retrieved.", count($result->getValueRanges()));
            return $result;
        }
        catch(Exception $e) {
            // TODO(developer) - handle error appropriately
            echo 'Message: ' .$e->getMessage();
          }
        }
```

### Python

sheets/snippets/sheets_batch_get_values.py [View on GitHub](https://github.com/googleworkspace/python-samples/blob/main/sheets/snippets/sheets_batch_get_values.py)

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def batch_get_values(spreadsheet_id, _range_names):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)
    range_names = [
        # Range names ...
    ]
    result = (
        service.spreadsheets()
        .values()
        .batchGet(spreadsheetId=spreadsheet_id, ranges=range_names)
        .execute()
    )
    ranges = result.get("valueRanges", [])
    print(f"{len(ranges)} ranges retrieved")
    return result
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: spreadsheet_id, and range_name

  batch_get_values("1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k", "A1:C2")
```

### Ruby

sheets/snippets/lib/spreadsheet_snippets.rb [View on GitHub](https://github.com/googleworkspace/ruby-samples/blob/main/sheets/snippets/lib/spreadsheet_snippets.rb)

```ruby
range_names = [
  # Range names ...
]
result = service.batch_get_spreadsheet_values(spreadsheet_id,
                                              ranges: range_names)
puts "#{result.value_ranges.length} ranges retrieved."
```

The response to this request is returned as a
[`BatchGetValuesResponse`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet#response-body)
object that contains the `spreadsheetId` and a list of
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource-valuerange)
objects.

## Write

To write to a sheet, you need the spreadsheet ID, the range of cells in A1
notation, and the data you wish to write within an appropriate request body
object. For more information about spreadsheet IDs and A1 notation, see [Google Sheets API Overview](https://developers.google.com/workspace/sheets/api/guides/concepts).

Updates require a valid
[`ValueInputOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption) parameter.
For singular updates, this is a required query parameter. For batch updates,
this parameter is required in the request body. The `ValueInputOption` controls
how input data should be interpreted and whether input strings are parsed or
not, as described in the following table:

| `ValueInputOption` | Description |
|---|---|
| `RAW` | The input is not parsed and is inserted as a string. For example, the input "=1+2" places the string, not the formula, "=1+2" in the cell. (Non-string values like booleans or numbers are always handled as `RAW`.) |
| `USER_ENTERED` | The input is parsed exactly as if it were entered into the Sheets UI. For example, "Mar 1 2016" becomes a date, and "=1+2" becomes a formula. Formats can also be inferred, so "$100.15" becomes a number with currency formatting. |

The singular and batch update methods are described below. For samples of basic
write operations, see [Basic writing](https://developers.google.com/workspace/sheets/api/samples/writing).

### Write to a single range

To write data to a single range, use a
[`spreadsheets.values.update`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update)
request:

### Apps Script

sheets/api/spreadsheet_snippets.gs [View on GitHub](https://github.com/googleworkspace/apps-script-samples/blob/main/sheets/api/spreadsheet_snippets.gs)

```javascript
/**
 * Updates the values in the specified range
 * @param {string} spreadsheetId spreadsheet's ID
 * @param {string} range the range of cells in spreadsheet
 * @param {string} valueInputOption determines how the input should be interpreted
 * @see
 * https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
 * @param {list<list<string>>} _values list of string lists to input
 * @returns {*} spreadsheet with updated values
 */
Snippets.prototype.updateValues = (
  spreadsheetId,
  range,
  valueInputOption,
  _values,
) => {
  // This code uses the Sheets Advanced Service, but for most use cases
  // the built-in method SpreadsheetApp.getActiveSpreadsheet()
  //     .getRange(range).setValues(values) is more appropriate.
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];

  try {
    const valueRange = Sheets.newValueRange();
    valueRange.values = values;
    const result = Sheets.Spreadsheets.Values.update(
      valueRange,
      spreadsheetId,
      range,
      { valueInputOption: valueInputOption },
    );
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log("Failed with error %s", err.message);
  }
};
```

### Java

sheets/snippets/src/main/java/UpdateValues.java [View on GitHub](https://github.com/googleworkspace/java-samples/blob/main/sheets/snippets/src/main/java/UpdateValues.java)

```java
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.UpdateValuesResponse;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

/* Class to demonstrate the use of Spreadsheet Update Values API */
public class UpdateValues {
  /**
   * Sets values in a range of a spreadsheet.
   *
   * @param spreadsheetId    - Id of the spreadsheet.
   * @param range            - Range of cells of the spreadsheet.
   * @param valueInputOption - Determines how input data should be interpreted.
   * @param values           - List of rows of values to input.
   * @return spreadsheet with updated values
   * @throws IOException - if credentials file not found.
   */
  public static UpdateValuesResponse updateValues(String spreadsheetId,
                                                  String range,
                                                  String valueInputOption,
                                                  List<List<Object>> values)
      throws IOException {
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

    UpdateValuesResponse result = null;
    try {
      // Updates the values in the specified range.
      ValueRange body = new ValueRange()
          .setValues(values);
      result = service.spreadsheets().values().update(spreadsheetId, range, body)
          .setValueInputOption(valueInputOption)
          .execute();
      System.out.printf("%d cells updated.", result.getUpdatedCells());
    } catch (GoogleJsonResponseException e) {
      // TODO(developer) - handle error appropriately
      GoogleJsonError error = e.getDetails();
      if (error.getCode() == 404) {
        System.out.printf("Spreadsheet not found with id '%s'.\n", spreadsheetId);
      } else {
        throw e;
      }
    }
    return result;
  }
}
```

### JavaScript

sheets/snippets/sheets_update_values.js [View on GitHub](https://github.com/googleworkspace/browser-samples/blob/main/sheets/snippets/sheets_update_values.js)

```javascript
function updateValues(spreadsheetId, range, valueInputOption, _values, callback) {
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];
  values = _values;
  const body = {
    values: values,
  };
  try {
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: valueInputOption,
      resource: body,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.updatedCells} cells updated.`);
      if (callback) callback(response);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}
```

### Node.js

sheets/snippets/sheets_update_values.js [View on GitHub](https://github.com/googleworkspace/node-samples/blob/main/sheets/snippets/sheets_update_values.js)

```javascript
import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

/**
 * Updates values in a spreadsheet.
 * @param {string} spreadsheetId The ID of the spreadsheet to update.
 * @param {string} range The range of cells to update.
 * @param {string} valueInputOption How the input data should be interpreted.
 * @param {(string[])[]} _values A 2D array of values to update.
 * @return {Promise<object>} The response from the update request.
 */
async function updateValues(spreadsheetId, range, valueInputOption, _values) {
  // Authenticate with Google and get an authorized client.
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create a new Sheets API client.
  const service = google.sheets({version: 'v4', auth});

  // The values to update in the spreadsheet.
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];

  // Create the request body.
  const resource = {
    values,
  };

  // Update the values in the spreadsheet.
  const result = await service.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption,
    resource,
  });

  // Log the number of updated cells.
  console.log('%d cells updated.', result.data.updatedCells);
  return result;
}
```

### PHP

sheets/snippets/src/SpreadsheetUpdateValues.php [View on GitHub](https://github.com/googleworkspace/php-samples/blob/main/sheets/snippets/src/SpreadsheetUpdateValues.php)

```php
<?php
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets\ValueRange;


function updateValues($spreadsheetId, $range, $valueInputOption)
    {
        /* Load pre-authorized user credentials from the environment.
           TODO(developer) - See https://developers.google.com/identity for
            guides on implementing OAuth2 for your application. */
        $client = new Google\Client();
        $client->useApplicationDefaultCredentials();
        $client->addScope(Google\Service\Drive::DRIVE);
        $service = new Google_Service_Sheets($client);
        try{
        $values = [["sample", 'values']];

        $body = new Google_Service_Sheets_ValueRange([
            'values' => $values
        ]);
        $params = [
            'valueInputOption' => $valueInputOption
        ];
        //executing the request
        $result = $service->spreadsheets_values->update($spreadsheetId, $range,
        $body, $params);
        printf("%d cells updated.", $result->getUpdatedCells());
        return $result;
    }
    catch(Exception $e) {
            // TODO(developer) - handle error appropriately
            echo 'Message: ' .$e->getMessage();
          }
    }
```

### Python

sheets/snippets/sheets_update_values.py [View on GitHub](https://github.com/googleworkspace/python-samples/blob/main/sheets/snippets/sheets_update_values.py)

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def update_values(spreadsheet_id, range_name, value_input_option, _values):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)
    values = [
        [
            # Cell values ...
        ],
        # Additional rows ...
    ]
    body = {"values": values}
    result = (
        service.spreadsheets()
        .values()
        .update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption=value_input_option,
            body=body,
        )
        .execute()
    )
    print(f"{result.get('updatedCells')} cells updated.")
    return result
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: spreadsheet_id,  range_name, value_input_option and  _values
  update_values(
      "1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k",
      "A1:C2",
      "USER_ENTERED",
      [["A", "B"], ["C", "D"]],
  )
```

### Ruby

sheets/snippets/lib/spreadsheet_snippets.rb [View on GitHub](https://github.com/googleworkspace/ruby-samples/blob/main/sheets/snippets/lib/spreadsheet_snippets.rb)

```ruby
values = [
  [
    # Cell values ...
  ]
  # Additional rows ...
]
data = [
  {
    range:  range_name,
    values: values
  },
  # Additional ranges to update ...
]
value_range_object = Google::Apis::SheetsV4::ValueRange.new(range:  range_name,
                                                            values: values)
result = service.update_spreadsheet_value(spreadsheet_id,
                                          range_name,
                                          value_range_object,
                                          value_input_option: value_input_option)
puts "#{result.updated_cells} cells updated."
```

The body of the update request must be a
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource-valuerange)
object, though the only required field is `values`. If `range` is specified, it
must match the range in the URL. In the `ValueRange`, you can optionally specify
its
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#dimension).
By default, `ROWS` is used. If `COLUMNS` is specified, each inner array is
written to a column instead of a row.

When updating, values with no data are skipped. To clear data, use an empty
string ("").

> [!NOTE]
> A `range` parameter can specify multiple cells (for example, A1:D5) or a single cell (for example, A1). If it specifies multiple cells, the input data must be within that range. If it specifies a single cell, the input data starts at that coordinate and can extend any number of rows or columns.

### Write multiple ranges

If you want to write multiple discontinuous ranges, you can use a
[`spreadsheets.values.batchUpdate`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate)
request:

### Apps Script

sheets/api/spreadsheet_snippets.gs [View on GitHub](https://github.com/googleworkspace/apps-script-samples/blob/main/sheets/api/spreadsheet_snippets.gs)

```javascript
/**
 * Updates the values in the specified range
 * @param {string} spreadsheetId spreadsheet's ID
 * @param {string} range range of cells of the spreadsheet
 * @param {string} valueInputOption determines how the input should be interpreted
 * @see
 * https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
 * @param {list<list<string>>} _values list of string values to input
 * @returns {*} spreadsheet with updated values
 */
Snippets.prototype.batchUpdateValues = (
  spreadsheetId,
  range,
  valueInputOption,
  _values,
) => {
  // This code uses the Sheets Advanced Service, but for most use cases
  // the built-in method SpreadsheetApp.getActiveSpreadsheet()
  //     .getRange(range).setValues(values) is more appropriate.
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];

  try {
    const valueRange = Sheets.newValueRange();
    valueRange.range = range;
    valueRange.values = values;

    const batchUpdateRequest = Sheets.newBatchUpdateValuesRequest();
    batchUpdateRequest.data = valueRange;
    batchUpdateRequest.valueInputOption = valueInputOption;

    const result = Sheets.Spreadsheets.Values.batchUpdate(
      batchUpdateRequest,
      spreadsheetId,
    );
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log("Failed with error %s", err.message);
  }
};
```

### Java

sheets/snippets/src/main/java/BatchUpdateValues.java [View on GitHub](https://github.com/googleworkspace/java-samples/blob/main/sheets/snippets/src/main/java/BatchUpdateValues.java)

```java
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.BatchUpdateValuesRequest;
import com.google.api.services.sheets.v4.model.BatchUpdateValuesResponse;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/* Class to demonstrate the use of Spreadsheet Batch Update Values API */
public class BatchUpdateValues {
  /**
   * Set values in one or more ranges of spreadsheet.
   *
   * @param spreadsheetId    - Id of the spreadsheet.
   * @param range            - Range of cells of the spreadsheet.
   * @param valueInputOption - Determines how input data should be interpreted.
   * @param values           - list of rows of values to input.
   * @return spreadsheet with updated values
   * @throws IOException - if credentials file not found.
   */
  public static BatchUpdateValuesResponse batchUpdateValues(String spreadsheetId,
                                                            String range,
                                                            String valueInputOption,
                                                            List<List<Object>> values)
      throws IOException {
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

    List<ValueRange> data = new ArrayList<>();
    data.add(new ValueRange()
        .setRange(range)
        .setValues(values));

    BatchUpdateValuesResponse result = null;
    try {
      // Updates the values in the specified range.
      BatchUpdateValuesRequest body = new BatchUpdateValuesRequest()
          .setValueInputOption(valueInputOption)
          .setData(data);
      result = service.spreadsheets().values().batchUpdate(spreadsheetId, body).execute();
      System.out.printf("%d cells updated.", result.getTotalUpdatedCells());
    } catch (GoogleJsonResponseException e) {
      // TODO(developer) - handle error appropriately
      GoogleJsonError error = e.getDetails();
      if (error.getCode() == 404) {
        System.out.printf("Spreadsheet not found with id '%s'.\n", spreadsheetId);
      } else {
        throw e;
      }
    }
    return result;
  }
}
```

### JavaScript

sheets/snippets/sheets_batch_update_values.js [View on GitHub](https://github.com/googleworkspace/browser-samples/blob/main/sheets/snippets/sheets_batch_update_values.js)

```javascript
function batchUpdateValues(spreadsheetId, range, valueInputOption, _values, callback) {
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];
  values = _values;
  const data = [];
  data.push({
    range: range,
    values: values,
  });
  // Additional ranges to update.

  const body = {
    data: data,
    valueInputOption: valueInputOption,
  };
  try {
    gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: body,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.totalUpdatedCells} cells updated.`);
      if (callback) callback(response);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}
```

### Node.js

sheets/snippets/sheets_batch_update_values.js [View on GitHub](https://github.com/googleworkspace/node-samples/blob/main/sheets/snippets/sheets_batch_update_values.js)

```javascript
import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

/**
 * Batch updates values in a spreadsheet.
 * @param {string} spreadsheetId The ID of the spreadsheet to update.
 * @param {string} range The range of cells to update.
 * @param {string} valueInputOption How the input data should be interpreted.
 * @param {(string[])[]} _values A 2D array of values to update.
 * @return {Promise<object>} The response from the batch update.
 */
async function batchUpdateValues(
  spreadsheetId,
  range,
  valueInputOption,
  _values,
) {
  // Authenticate with Google and get an authorized client.
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create a new Sheets API client.
  const service = google.sheets({version: 'v4', auth});

  // The values to update in the spreadsheet.
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];

  // The data to be updated.
  const data = [
    {
      range,
      values,
    },
  ];

  // Additional ranges to update can be added here.

  // Create the batch update request.
  const resource = {
    data,
    valueInputOption,
  };

  // Execute the batch update request.
  const result = await service.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource,
  });

  // Log the number of updated cells.
  console.log('%d cells updated.', result.data.totalUpdatedCells);
  return result;
}
```

### PHP

sheets/snippets/src/SpreadsheetBatchUpdateValues.php [View on GitHub](https://github.com/googleworkspace/php-samples/blob/main/sheets/snippets/src/SpreadsheetBatchUpdateValues.php)

```php
<?php
/**
 * to update values in batch for a particular spreadsheet
 */
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets;

function batchUpdateValues($spreadsheetId, $range, $valueInputOption)
    {
        /* Load pre-authorized user credentials from the environment.
           TODO(developer) - See https://developers.google.com/identity for
            guides on implementing OAuth2 for your application. */
        $client = new Google\Client();
        $client->useApplicationDefaultCredentials();
        $client->addScope(Google\Service\Drive::DRIVE);
        $service = new Google_Service_Sheets($client);
        $values = [];
        try{

            $data[] = new Google_Service_Sheets_ValueRange([
                'range' => $range,
            'values' => $values
        ]);
        $body = new Google_Service_Sheets_BatchUpdateValuesRequest([
            'valueInputOption' => $valueInputOption,
            'data' => $data
        ]);
        $result = $service->spreadsheets_values->batchUpdate($spreadsheetId, $body);
        printf("%d cells updated.", $result->getTotalUpdatedCells());
        return $result;
    }

        catch(Exception $e) {
            // TODO(developer) - handle error appropriately
            echo 'Message: ' .$e->getMessage();
          }
    }
```

### Python

sheets/snippets/sheets_batch_update_values.py [View on GitHub](https://github.com/googleworkspace/python-samples/blob/main/sheets/snippets/sheets_batch_update_values.py)

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def batch_update_values(
    spreadsheet_id, range_name, value_input_option, _values
):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)

    values = [
        [
            # Cell values ...
        ],
        # Additional rows
    ]
    data = [
        {"range": range_name, "values": values},
        # Additional ranges to update ...
    ]
    body = {"valueInputOption": value_input_option, "data": data}
    result = (
        service.spreadsheets()
        .values()
        .batchUpdate(spreadsheetId=spreadsheet_id, body=body)
        .execute()
    )
    print(f"{(result.get('totalUpdatedCells'))} cells updated.")
    return result
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: spreadsheet_id, range_name value_input_option and _values)
  batch_update_values(
      "1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k",
      "A1:C2",
      "USER_ENTERED",
      [["F", "B"], ["C", "D"]],
  )
```

### Ruby

sheets/snippets/lib/spreadsheet_snippets.rb [View on GitHub](https://github.com/googleworkspace/ruby-samples/blob/main/sheets/snippets/lib/spreadsheet_snippets.rb)

```ruby
values = [
  [
    # Cell values ...
  ]
  # Additional rows ...
]
data = [
  {
    range:  range_name,
    values: values
  },
  # Additional ranges to update ...
]
batch_update_values = Google::Apis::SheetsV4::BatchUpdateValuesRequest.new(
  data:               data,
  value_input_option: value_input_option
)
result = service.batch_update_values(spreadsheet_id, batch_update_values)
puts "#{result.total_updated_cells} cells updated."
```

The body of the batch update request must be a
[`BatchUpdateValuesRequest`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate#request-body)
object, which contains a `ValueInputOption` and a list of
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource-valuerange)
objects (one for each written range). Each `ValueRange` object specifies its own
`range`, `majorDimension`, and input data.

### Append values

To append data after a table of data in a sheet, use a
[`spreadsheets.values.append`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append)
request:

### Apps Script

sheets/api/spreadsheet_snippets.gs [View on GitHub](https://github.com/googleworkspace/apps-script-samples/blob/main/sheets/api/spreadsheet_snippets.gs)

```javascript
/**
 * Appends values to the specified range
 * @param {string} spreadsheetId spreadsheet's ID
 * @param {string} range range of cells in the spreadsheet
 * @param valueInputOption determines how the input should be interpreted
 * @see
 * https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
 * @param {list<string>} _values list of rows of values to input
 * @returns {*} spreadsheet with appended values
 */
Snippets.prototype.appendValues = (
  spreadsheetId,
  range,
  valueInputOption,
  _values,
) => {
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];
  try {
    const valueRange = Sheets.newRowData();
    valueRange.values = values;

    const appendRequest = Sheets.newAppendCellsRequest();
    appendRequest.sheetId = spreadsheetId;
    appendRequest.rows = [valueRange];

    const result = Sheets.Spreadsheets.Values.append(
      valueRange,
      spreadsheetId,
      range,
      { valueInputOption: valueInputOption },
    );
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log("Failed with error %s", err.message);
  }
};
```

### Java

sheets/snippets/src/main/java/AppendValues.java [View on GitHub](https://github.com/googleworkspace/java-samples/blob/main/sheets/snippets/src/main/java/AppendValues.java)

```java
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.AppendValuesResponse;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

/* Class to demonstrate the use of Spreadsheet Append Values API */
public class AppendValues {
  /**
   * Appends values to a spreadsheet.
   *
   * @param spreadsheetId    - Id of the spreadsheet.
   * @param range            - Range of cells of the spreadsheet.
   * @param valueInputOption - Determines how input data should be interpreted.
   * @param values           - list of rows of values to input.
   * @return spreadsheet with appended values
   * @throws IOException - if credentials file not found.
   */
  public static AppendValuesResponse appendValues(String spreadsheetId,
                                                  String range,
                                                  String valueInputOption,
                                                  List<List<Object>> values)
      throws IOException {
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

    AppendValuesResponse result = null;
    try {
      // Append values to the specified range.
      ValueRange body = new ValueRange()
          .setValues(values);
      result = service.spreadsheets().values().append(spreadsheetId, range, body)
          .setValueInputOption(valueInputOption)
          .execute();
      // Prints the spreadsheet with appended values.
      System.out.printf("%d cells appended.", result.getUpdates().getUpdatedCells());
    } catch (GoogleJsonResponseException e) {
      // TODO(developer) - handle error appropriately
      GoogleJsonError error = e.getDetails();
      if (error.getCode() == 404) {
        System.out.printf("Spreadsheet not found with id '%s'.\n", spreadsheetId);
      } else {
        throw e;
      }
    }
    return result;
  }
}
```

### JavaScript

sheets/snippets/sheets_append_values.js [View on GitHub](https://github.com/googleworkspace/browser-samples/blob/main/sheets/snippets/sheets_append_values.js)

```javascript
function appendValues(spreadsheetId, range, valueInputOption, _values, callback) {
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];
  values = _values;
  const body = {
    values: values,
  };
  try {
    gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: valueInputOption,
      resource: body,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.updates.updatedCells} cells appended.`);
      if (callback) callback(response);
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
}
```

### Node.js

sheets/snippets/sheets_append_values.js [View on GitHub](https://github.com/googleworkspace/node-samples/blob/main/sheets/snippets/sheets_append_values.js)

```javascript
import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

/**
 * Appends values to a spreadsheet.
 * @param {string} spreadsheetId The ID of the spreadsheet to update.
 * @param {string} range The range of cells to append to.
 * @param {string} valueInputOption How the input data should be interpreted.
 * @param {(string[])[]} _values A 2D array of values to append.
 * @return {Promise<object>} The response from the append request.
 */
async function appendValues(spreadsheetId, range, valueInputOption, _values) {
  // Authenticate with Google and get an authorized client.
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create a new Sheets API client.
  const service = google.sheets({version: 'v4', auth});

  // The values to append to the spreadsheet.
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];

  // Create the request body.
  const resource = {
    values,
  };

  // Append the values to the spreadsheet.
  const result = await service.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    resource,
  });

  // Log the number of appended cells.
  console.log(`${result.data.updates.updatedCells} cells appended.`);
  return result;
}
```

### PHP

sheets/snippets/src/SpreadsheetAppendValues.php [View on GitHub](https://github.com/googleworkspace/php-samples/blob/main/sheets/snippets/src/SpreadsheetAppendValues.php)

```php
<?php
use Google\Client;
use Google\Service\Sheets;


function appendValues($spreadsheetId, $range, $valueInputOption)
{
    /* Load pre-authorized user credentials from the environment.
       TODO(developer) - See https://developers.google.com/identity for
        guides on implementing OAuth2 for your application. */
    $client = new Google\Client();
    $client->useApplicationDefaultCredentials();
    $client->addScope('https://www.googleapis.com/auth/spreadsheets');
    $service = new Google\Service\Sheets($client);
    try {
        $values = []; //add the values to be appended
        //execute the request
        $body = new Google_Service_Sheets_ValueRange([
            'values' => $values
        ]);
        $params = [
            'valueInputOption' => $valueInputOption
        ];
        $result = $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);
        printf("%d cells appended.", $result->getUpdates()->getUpdatedCells());
        return $result;
    } catch (Exception $e) {
        // TODO(developer) - handle error appropriately
        echo 'Message: ' . $e->getMessage();
    }
```

### Python

sheets/snippets/sheets_append_values.py [View on GitHub](https://github.com/googleworkspace/python-samples/blob/main/sheets/snippets/sheets_append_values.py)

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def append_values(spreadsheet_id, range_name, value_input_option, _values):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)

    values = [
        [
            # Cell values ...
        ],
        # Additional rows ...
    ]
    body = {"values": values}
    result = (
        service.spreadsheets()
        .values()
        .append(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption=value_input_option,
            body=body,
        )
        .execute()
    )
    print(f"{(result.get('updates').get('updatedCells'))} cells appended.")
    return result

  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: spreadsheet_id, range_name value_input_option and _values)
  append_values(
      "1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k",
      "A1:C2",
      "USER_ENTERED",
      [["F", "B"], ["C", "D"]],
  )
```

### Ruby

sheets/snippets/lib/spreadsheet_snippets.rb [View on GitHub](https://github.com/googleworkspace/ruby-samples/blob/main/sheets/snippets/lib/spreadsheet_snippets.rb)

```ruby
values = [
  [
    # Cell values ...
  ],
  # Additional rows ...
]
value_range = Google::Apis::SheetsV4::ValueRange.new(values: values)
result = service.append_spreadsheet_value(spreadsheet_id,
                                          range_name,
                                          value_range,
                                          value_input_option: value_input_option)
puts "#{result.updates.updated_cells} cells appended."
```

The body of the update request must be a
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource-valuerange)
object, though the only required field is `values`. If `range` is specified, it
must match the range in the URL. In the `ValueRange`, you can optionally specify
its
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#dimension).
By default, `ROWS` is used. If `COLUMNS` is specified, each inner array is
written to a column instead of a row.

> [!NOTE]
> The `majorDimension` parameter doesn't control if data is added as rows or columns to the table. Data is always added to subsequent rows. The parameter only controls how the input data is read.

The input range is used to search for existing data and find a "table" within
that range. Values are appended to the next row of the table, starting with the
first column of the table. For example, consider `Sheet1` that looks like:

|---|---|---|---|---|---|
|   | A | B | C | D | E |
| 1 | x | y | z |   |   |
| 2 | x | y | z |   |   |
| 3 |   |   |   |   |   |
| 4 |   | x | y |   |   |
| 5 |   |   | y | z |   |
| 6 |   | x | y | z |   |
| 7 |   |   |   |   |   |

There are 2 tables in the sheet: `A1:C2`, and `B4:D6`. Appended values would
begin at `B7` for all the following `range` inputs:

- `Sheet1`, because it will examine all the data in the sheet and determine that the table at `B4:D6` is the last table.
- `B4` or `C5:D5`, because they're both in the `B4:D6` table.
- `B2:D4`, because the last table in the range is the `B4:D6` table (despite it also containing the `A1:C2` table).
- `A3:G10`, because the last table in the range is the `B4:D6` table (despite starting before and ending after it).

The following `range` inputs wouldn't start writing at `B7`:

- `A1` would start writing at `A3`, because that's in the `A1:C2` table.
- `E4` would start writing at `E4`, because it's not in any table. (`A4` would also start writing at `A4` for the same reasons.)

Additionally, you can choose if you want to overwrite existing data after a
table or insert new rows for the new data. By default, the input overwrites data
after the table. To write the new data into new rows, use the
[`InsertDataOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append#insertdataoption)
and specify `insertDataOption=INSERT_ROWS`.

To learn more about cell and row limits in Sheets, see
[Files you can store in Google Drive](https://support.google.com/drive/answer/37603).
