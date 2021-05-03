# Card Scanner API Project

## Getting Started
- Make sure that you have the latest version of nodejs and npm installed. I have been using nodejs version `16.0.0` and npm version `7.11.2`.
- Run `npm install` to install the npm packages.
- Run `npm run start` or `node app.js` to run the application. By default it will run on port 8000, but this can be configured in the .env file.

## Usage
This application has two primary APIs:

### Management API
This API manages scanners and permission groups for employees to access them. For the purposes of this exercise this API is not authenticated, however you would certainly want to restrict access to this API so that only administrators can use it, otherwise the authentication for the events API pointless.

A permission rule can be created via `POST /rule`. This rule will include a list of employees and a list of scanners that those employees can access. If `permittedTimes` is present then the employees will have their access restricted to those times. Otherwise the default is that they will have permanent access to the list of scanners.
Here is an example payload for a rule that will allow employees `1` and `2` to access the scanner with ID `153eb555-c9dd-4d60-a17f-ff72b61cd847` for the first 60 minutes of the day:
```
{
    {
        "employees": [1, 2],
        "scanners": ["153eb555-c9dd-4d60-a17f-ff72b61cd847"],
        "permittedTimes": [
            {
            "startTimeMin": 0,
            "endTimeMin": 60
            }
        ]
    }
}
```

### Events API
This API manages incoming events from the scanners. A scanner can be onboarded to the system via `POST /scanner`. The response payload will include an apikey which can be used for future requests from the scanner, just include the apikey in the `X-API-Key` header of any future requests to the events API. Other than that, these events conform to the specifications given in the examples.