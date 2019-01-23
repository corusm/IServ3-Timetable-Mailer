const express = require('express');
const router = express.Router();
const winlog = require(`../logger.js`)();
const dick = require('request');
const fs = require("fs")
var request = dick.defaults({ jar: true }) // Cookies enabled
const hts = require('html-table-to-json');

// const checkAuth = require(`${__dirname}/../middleware/check-auth`); // Login Required for usage!

// Files
let config = require(`${__dirname}/../../config.json`);
config = config.schools[0];

// Send Wochentag with API!
router.get('/', async (req, res, next) => {
    try {
        let userClass = req.query.klasse;
        request.post({ url: `https://${config.schoolDomain}/iserv/login_check`, form: { _username: config.usr, _password: config.psw, _remember_me: 'on' } }, function (err, httpResponse, body) {
            request.post({ url: `https://${config.schoolDomain}/iserv/plan/show/raw/Vertretungsplan%20Sch%C3%BCler%20heute/subst_001.htm` }, function (err, httpResponse, body) {
                let BodyHeute = body;

                request.post({ url: `https://${config.schoolDomain}/iserv/plan/show/raw/Vertretungsplan%20Sch%C3%BCler%20Folgetag/subst_001.htm` }, function (err, httpResponse, body) {
                    res.status(200).json({
                        lastUpdate: time(),
                        dayOfHeute: getDayOfSchedule(BodyHeute),
                        PlanHeute: subString(BodyHeute, userClass),
                        dayOfMorgen: getDayOfSchedule(body),
                        PlanMorgen: subString(body, userClass)
                    })
                })
            })

            winlog.logger.log("info", req.connection.remoteAddress + " made a GET request to /timetable");
        })
    } catch (err) {
        res.status(500).json({
            error: err
        })
    }
});

module.exports = router;

function getDayOfSchedule(body) {
    let wday = body.split('<div class="mon_title">')
    wday = wday[1].split('</div>');
    wday = wday[0].split(' ')
    return wday[1];
}

function subString(body, userKlasse) {
    let spl = body.split("<table class=\"mon_list\" >");
    spl = spl[1].split("</table>");
    let out = spl[0];
    out = `<table>${out}</table>`;

    // Modify String
    let replaced = out;
    replaced = replaced.replace("(Klasse(n))", "Klasse");
    replaced = replaced.replace("(Raum)", "VertretungsRaum");
    replaced = replaced.replace("(Lehrer)", "Lehrer");
    replaced = replaced.replace("(Fach)", "Fach");
    replaced = replaced.replace("(Raum)", "Raum");
    replaced = replaced.replace(/ - /g, "/");
    replaced = replaced.replace(/-/g, "");

    let jsonTables = new hts(replaced);
    let output = jsonTables.results[0];

    if (userKlasse) {
        let sendOut;
        let run = true;
        for (var i = 0; i < output.length; i++) {
            let loopKlasse = JSON.stringify(output[i].Klasse);
            if (loopKlasse.match(userKlasse)) {
                if (!run) {
                    sendOut = `${sendOut},${JSON.stringify(output[i])}`;
                }
                if (run) {
                    sendOut = `[${JSON.stringify(output[i])}`;
                    run = false;
                }
            }
        }
        sendOut = `${sendOut}]`
        return JSON.parse(sendOut);
    } else {
        return output;
    }
}

function time() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}