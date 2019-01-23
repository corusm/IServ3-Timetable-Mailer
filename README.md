# Unofficial IServ 3 API - Timetable Mailer

This is the Unofficial IServ 3 API for the replacementplan module of IServ. It logs into your IServ Account and reads the replacementplan. Then it downloads the Website and Filters it for all the data you care. Daily at the time the plan gets updated an email gets fired to all the users. In addition to that an email gets fired at 18:00 for getting the up-to-date plan for the next Day. 

You can register yourself at http://localhost:80 and add all your data.

If you want to make your own things work there is a code snippet for loggin into IServ at the end of the DOC.

ENJOY!

Important infos:
- Mutltiple users possible via the login form
- Self hosting!
    - No guarantee for correct data

# Documentation

## Install / Self Hosting

First install the nodejs and npm packages
```
sudo apt-get install nodejs
```
```
sudo apt-get install npm
```

then clone the git repos to your Server
```
git clone https://github.com/corusm/IServ3-Timetable-Mailer.git
```

## Install dependencies
```
npm install
```

## Add login Data to Config
Add add all the necessary data to the **config.json** File
```
{
    "user": "emailSMPTUser",
    "password": "password",
    "host": "smtpHost",
    "ssl": false,
    "schools": [
        {
            "usr": "iserv-username",
            "psw": "secret",
            "schoolDomain": "school-domain"
        }
    ]
}
```

## Edit preferences in index.js File
1. The scheduler can be edited Line 19-29 in crontab notation (https://crontab.guru)
2. Edit schedule plan URL at line 41 (Today) and 44 (Tomorrow)

## Run the bot
Navigate to the directory where you have installed the bot (where the **index.js** file is located) and run these commands:

1. Start Bot: `node index.js`
2. Stop Bot: `pkill -f node`

## Webserver for Registration
Running on Localhost:80. Here you can enter your schedule in a form and it gets served to the bot. Each user can be registered one time. After that every user has to be deleted manually.

## Log
All the logs that you see in the shell also get logged in the **info.log** file.

## Code Snipped for logging into IServ with nodejs request library
```
const requ = require('request'); // Import Request Lib
let request = requ.defaults({ jar: true }) // Enable Cookies and save them for future Logins

let schoolDomain = 'example.com';

request.post({ url: `https://${schoolDomain}/iserv/login_check`, form: { _username: "iserv-user", _password: "secret", _remember_me: 'on' } }, function (err, httpResponse, body) {
            request.post({ url: `https://${schoolDomain}/iserv/plan/show/raw/Vertretungsplan%20Sch%C3%BCler%20heute/subst_001.htm` }, function (err, httpResponse, body) {
                console.log(body);
            })
        })
```

# Help me improving this bot! 
If there is any bug to fix or you have a feature request do not hesitate to conctact me!
