const email = require(`${__dirname}/node_modules/emailjs/email`);
const dick = require('request');
const schedule = require('node-schedule');
var tafy = require('tableify');
const fs = require('fs');
var request = dick.defaults({ jar: true }) // Cookies enabled
const hts = require('html-table-to-json');

// Imports
const unt = require(`${__dirname}/unterricht.json`); // Schedule in here
const config = require(`${__dirname}/config.json`);
let winston = require(`${__dirname}/logger.js`);
let logger = winston.logger;
configTime = config.schools[0];

// Hello World
logger.log('info', 'Service running');

// Scheduler ---------------------------------------
schedule.scheduleJob('15 7 * * 1-5', function () { // Mon-Fri 7:26
    startProcess(true);
});
schedule.scheduleJob('1 18 * * 1-4', function () { // Mon-Fri 16:1
    startProcess();
});
schedule.scheduleJob('1 18 * * 7', function () { // Mon-Fri 16:1
    startProcess();
});
// -------------------------------------------------
startProcess(true);

// Lessons
let lessons = [745, 920, 1135, 1415]; // Time of Lessons
let classes = [1, 3, 5, 8]; // Number of Classes to check


function startProcess(process) {
    try {
        let userClass = 13; // Change for own Klass or leave empty
        request.post({ url: `https://${configTime.schoolDomain}/iserv/login_check`, form: { _username: configTime.usr, _password: configTime.psw, _remember_me: 'on' } }, function (err, httpResponse, body) {
            request.post({ url: `https://${configTime.schoolDomain}/iserv/plan/show/raw/Vertretungsplan%20Sch%C3%BCler%20heute/subst_001.htm` }, function (err, httpResponse, body) {
                let BodyHeute = body;

                request.post({ url: `https://${configTime.schoolDomain}/iserv/plan/show/raw/Vertretungsplan%20Sch%C3%BCler%20Folgetag/subst_001.htm` }, function (err, httpResponse, body) {
                    let plan = {
                        lastUpdate: time(),
                        dayOfHeute: getDayOfSchedule(BodyHeute),
                        PlanHeute: subString(BodyHeute, userClass),
                        dayOfMorgen: getDayOfSchedule(body),
                        PlanMorgen: subString(body, userClass)
                    }
                    console.log(plan);
                    // Read Plan; Make it to Email Content; Merge it with HTML File and then sent
                    if (weekday(plan.dayOfHeute) === date() || !process) {
                        for (let i = 0; i < unt.length; i++) {
                            getEmailContent(jtEmail(getEntfall(plan.PlanHeute, plan.dayOfHeute, i)), jtEmail(getEntfall(plan.PlanMorgen, plan.dayOfMorgen, i)), plan.dayOfHeute, plan.dayOfMorgen, unt[i].name, unt[i].email);
                        }
                    } else {
                        if (time() < 745) { // Time until the plan refreshes
                            logger.log("info", `plan gets pulled in one minute`);
                            setTimeout(function () {
                                startProcess(true);
                                logger.log("info", `plan gets pulled in one minute`);
                            }, 60000);
                        } else {
                            logger.log("info", `Kein aktueller Plan bis 7:50 old plan will be sent!`) // Same Value as if clause
                            startProcess();
                        }
                    }
                })
            })
        })
    } catch (err) {
        logger.log('info', 'error');
        console.log(err)
    }
}

// Get relevant data on plan
function getEntfall(plan, tag, k) {
    let run = true;
    let out;
    for (let i = 0; i < plan.length; i++) {
        let top = plan[i].Stunde;
        for (let j = 0; j < 4; j++) {
            if (top.match(classes[j]) && unt[k].schedule[weekday(tag)][classes[j]] === plan[i].Lehrer) {
                if (!run) {
                    out = `${out},${JSON.stringify(plan[i])}`;
                }
                if (run) {
                    out = `[${JSON.stringify(plan[i])}`;
                    run = false;
                }
            }
        }
    }
    if (out) {
        out = `${out}]`;
        return JSON.parse(out);
    } else {
        return { "message": "empty" }
    }
}

// Make email content
function jtEmail(pl) {
    let string = ``;
    if (pl.message === 'empty') return `Keine deiner Stunden entfallen.`;
    for (let i = 0; i < pl.length; i++) {
        let ap = pl[i];
        string = `${string}${ap.Stunde}: ${ap.Lehrer}, ${ap.Art}, ${ap.Fach}`;
        if (pl.length > 1) { string = `${string}<br />` }
    }
    return string;
}

// Logic für wann die erste Stunde ist
let server = email.server.connect({
    user: config.user,
    password: config.password,
    host: config.host,
    ssl: config.ssl
});

// Merge email with content
function getEmailContent(t1, t2, dayHeute, dayMorgen, username, email) {
    t1 = t1.replace('<table', '<table id="plan"');
    t2 = t2.replace('<table', '<table id="plan"');
    fs.readFile(`${__dirname}/email.html`, "utf8", function (err, data) {
        // Place costum text
        data = data.replace('mailtitle', 'Vertretungsplan Info');
        data = data.replace('mailusername', username);
        data = data.replace('mailheute', dayHeute);
        data = data.replace('mailmorgen', dayMorgen);
        data = data.replace('mailplanheute', `<strong>${dayHeute}</strong>:<br />${t1}`);
        data = data.replace('mailplanmorgen', `<strong>${dayMorgen}</strong>:<br />${t2}`);
        data = data.replace('mailheader', `Vertretungsplan: ${dayHeute} & ${dayMorgen}:`);

        sendMail(data, username, email)
    });
}


// send the message and get a callback with an error or details of the message that was sent
function sendMail(content, username, email) {
    server.send({
        text: ` `,
        from: config.user,
        to: `${username} <${email}>`,
        subject: "Vertretungsplan Info",
        attachment:
            [
                { data: content, alternative: true },
            ]
    }, function (err, message) {
        if (message) {
            logger.log('info', `email sent to ${username} <${email}>`)
        }
    });
}

// Functions
function date() {
    let date = new Date();
    let day = date.getDay();
    return day;
}

function time() {
    let date = new Date();
    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    let min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    return hour + min;
}

let dates = [
    { "wochentag": "Montag", "num": "1" },
    { "wochentag": "Dienstag", "num": "2" },
    { "wochentag": "Mittwoch", "num": "3" },
    { "wochentag": "Donnerstag", "num": "4" },
    { "wochentag": "Freitag", "num": "5" }
];
// API should give data of one of the schedules
function weekday(morgen) {
    for (let i = 0; i < dates.length; i++) {
        if (dates[i].wochentag === morgen) {
            return dates[i].num;
        }
    }
}

// Other Stuff Js
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

    // Modify String -- Must be edited for other schools
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