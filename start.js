//Packages
const express = require("express");
const app = express();
const router = express.Router();
const winlog = require(`${__dirname}/logger.js`);
const logger = winlog.logger;
const fs = require(`fs`);

// Config
const config = require(`${__dirname}/config.json`)
app.use(express.static(`${__dirname}/public`));

app.listen(80, function () {
    logger.log("info", "Webserver is running!");
});

// Timetable entry
router.post('/timetableentry', (req, res, next) => {
    let newUser =
    {
        "name": req.body.name,
        "email": req.body.email,
        "schedule": {
            "1": {
                "1": req.body.m1,
                "3": req.body.m3,
                "5": req.body.m5,
                "8": req.body.m8
            },
            "2": {
                "1": req.body.d1,
                "3": req.body.d3,
                "5": req.body.d5,
                "8": req.body.d8
            },
            "3": {
                "1": req.body.i1,
                "3": req.body.i3,
                "5": req.body.i5,
                "8": req.body.i8
            },
            "4": {
                "1": req.body.o1,
                "3": req.body.o3,
                "5": req.body.o5,
                "8": req.body.o8
            },
            "5": {
                "1": req.body.f1,
                "3": req.body.f3,
                "5": req.body.f5,
                "8": req.body.f8
            }
        }
    }

    addToJson(newUser);

    res.status(200).json({
        message: 'user processed'
    })
    winlog.logger.log("info", "someone" + " made a POST request to / && ");
});

// AddNewUserToJson and Check if he already exists
function addToJson(newUser) {
    try {
        // Unterricht.json must contain JSON Array
        fs.readFile(`${__dirname}/unterricht.json`, "utf8", function (err, data) {
            if (err) console.log(err);
            data = JSON.parse(data);
            if (data.length === 0) {
                data.push(newUser);
                fs.writeFile(`${__dirname}/unterricht.json`, JSON.stringify(data, null, 2), 'utf-8');
            } else {
                let st = true;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].email === newUser.email) {
                        st = false;
                    }
                }
                if (st) {
                    data.push(newUser);
                    fs.writeFile(`${__dirname}/unterricht.json`, JSON.stringify(data, null, 2), 'utf-8');
                }
            }
        });
    } catch (err) {
        console.log(err);

    }
}

module.exports = app;