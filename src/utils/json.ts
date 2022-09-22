import { ICsvFile } from "@/interfaces";

export function downloadHarvestJSON(csvFile: ICsvFile) {
    // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side

    // [
    //     {
    //       "Plant": "ABCDEF012345670000010011",
    //       "Weight": 100.23,
    //       "UnitOfWeight": "Grams",
    //       "DryingLocation": "Harvest Location",
    //       "HarvestName": "2015-12-15-Harvest Location-H",
    //       "PatientLicenseNumber": "X00001",
    //       "ActualDate": "2015-12-15"
    //     }
    // ]

    const data = [];

    for (let row of csvFile.data) {
        data.push({
            "Plant": row[0],
            "Weight": parseFloat(row[1]),
            "UnitOfWeight": row[2],
            "DryingLocation": row[3],
            "HarvestName": row[4],
            "PatientLicenseNumber": row[5],
            "ActualDate": row[6]
        })
    }

    let fileData: string = "data:text/json;charset=utf-8,"
        + JSON.stringify(data)

    let encodedUri = encodeURI(fileData);

    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", csvFile.filename.replace('.csv', '.json'));
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "my_data.csv".
}