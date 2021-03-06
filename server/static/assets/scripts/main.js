// @license magnet:?xt=urn:btih:3877d6d54b3accd4bc32f8a48bf32ebc0901502a&dn=mpl-2.0.txt Mozilla-Public-2.0
//initialize globals
var outstandingRequests = [];
var errorNotifications = [];
var now = new Date();
var rollTime = new Date();
window.hamburger = false;

rollTime.setUTCHours(3, 0, 0, 0);
if (rollTime < now) {
    rollTime.setUTCDate(rollTime.getUTCDate() + 1)
}

// JS is enabled, so hide that notif
document.getElementById('error-notif').style.display = "none";

// link handling
document.addEventListener('click', function(event) {
    switch (event.target.tagName) {
        case 'path':
            window.history.pushState("Rust Risk", "Rust Risk", '/territory/'.concat(event.target.attributes['name'].value));
            break;
        case 'A':
            if (link_is_external(event.target)) return;
            event.preventDefault();
            window.history.pushState("Rust Risk", "Rust Risk", event.target.href);
            break;
        default:
            return;
    }
}, false);

document.getElementById('burger').addEventListener('click', function(event) {
    window.burger = !window.burger;
    document.getElementById('nav').style.display = (window.burger) ? 'flex' : 'none';
});


//request handling
function doAjaxGetRequest(url, source, callback, errorcallback = defaultErrorNotif) {
    var instance_index = addUrlFromRequests(source, url);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            if (typeof callback == 'function') {
                callback(this);
            } else {
                return JSON.parse(this.response);
            }
            updateUrlFromRequests(instance_index, 1);
            // return JSON.parse(this.response);
        } else if (this.readyState == 4 && this.status != 200) {
            globalError = true;
            errorcallback(this);
            updateUrlFromRequests(instance_index, 1);
            //document.getElementsById("loadicon").classList.add("blink");
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

function addUrlFromRequests(source, url) {
    var index = outstandingRequests.push({ source: source, url: url, state: 0 }) - 1;
    updateLoaderVisibility();
    return index;
}

function updateUrlFromRequests(index, status) {
    if (index > -1) {
        outstandingRequests[index].state = status;
    }
    updateLoaderVisibility();
}

function updateLoaderVisibility(forceHide = false) {
    let pending = false;
    for (i in outstandingRequests) {
        if (outstandingRequests[i].state == 0) {
            pending = true;
            break;
        }
    }
    if (pending == false && forceHide === false) {
        //stop loader
        document.getElementById("loadicon").classList.remove("spin");
    } else {
        //start loader
        //check if globalError
        document.getElementById("loadicon").classList.add("spin");
    }
}

/*** Error Notifications ***/

function errorNotif(title, body, button1, button2, resolveself = true, skipnotifcheck = false, errorIndex = 0) {
    if (skipnotifcheck != true) {
        errorIndex = errorNotifications.push({ title: title, body: body, button1: button1, button2: button2, status: 1, resolveself: resolveself }) - 1;
    }
    let vset = errorNotifications[errorIndex - 1] || { status: 0 };
    if (vset.status == 0) {
        document.getElementById('error-notif').style.display = "block";
        document.getElementById('error-notif-title').innerHTML = title || "General Error";
        document.getElementById('error-notif-body').innerHTML = body || "Hmm, no error was specified. Try notifying <a href=\"https://github.com/mautamu/risk\">u/Mautamu</a> if this issue persists.";
        document.getElementById('error-notif-button-1').innerHTML = button1.text || "";
        document.getElementById('error-notif-button-1-container').style.display = button1.display || "block";
        document.getElementById('error-notif-button-1').onclick = function() {
            try {
                if (typeof button1.action == "function") {
                    button1.action();
                }
                if (resolveself == true) {
                    errorNotifications[errorIndex].status = 0;
                }
            } finally {
                errorOver(errorIndex);
            }
        };
        document.getElementById('error-notif-button-2').innerHTML = button2.text || "";
        document.getElementById('error-notif-button-2-container').style.display = button2.display || "block";
        document.getElementById('error-notif-button-2').onclick = function() {
            try {
                if (typeof button2.action == "function") {
                    button2.action();
                }
                if (resolveself == true) {
                    errorNotifications[errorIndex].status = 0;
                }
            } finally {
                errorOver(errorIndex);
            }
        };
    }
}

function errorOver(errorIndex) {
    if (errorNotifications[errorIndex].status == 0) {
        //move to next one or hide
        let pending = false;
        for (i in errorNotifications) {
            if (errorNotifications[i].status != 0) {
                pending = true;
                errorNotif(errorNotifications[i].title, errorNotifications[i].body, errorNotifications[i].button1, errorNotifications[i].button2, errorNotifications[i].resolveself, true, i);
                break;
            }
        }
        if (pending == false) {
            document.getElementById('error-notif').style.display = "none";
        }
    } else {
        //do nothing
    }
}

function defaultErrorNotif(data) {
    errorNotif(
        'Fetch Error',
        '<h1>Howdy partner</h1>, unfortunately we encountered an error. Not sure what it\'s about. <br/><br/> If this keeps occuring, please <a href="mailto:risk@aggierisk.ml">email us.</a>', {
            text: "Okay",
            action: function() {}
        }, {
            display: "none",
            action: function() {}
        }
    )
}

function drawPlayerCard(userObject, teamObject) {
    var template = document.getElementById("templatePlayerCard");

    var templateHtml = template.innerHTML;

    var listHtml = "";
    var index = 0;
    for (i in window.teamsObject) {
        if (window.teamsObject[i].name == teamObject.team) {
            index = i;
        }
    }
    listHtml += templateHtml
        .replace(/{{user_name}}/g, userObject.name)
        .replace(/{{user_team_color}}/, userObject.team.colors.primary)
        .replace(/{{overall}}/g, "✯".repeat(userObject.ratings.overall))
        .replace(/{{total_turns_stars}}/g, "✯".repeat(userObject.ratings.totalTurns))
        .replace(/{{round_turns_stars}}/g, "✯".repeat(userObject.ratings.gameTurns))
        .replace(/{{mvps_stars}}/g, "✯".repeat(userObject.ratings.mvps))
        .replace(/{{streak_stars}}/g, "✯".repeat(userObject.ratings.streak))
        .replace(/{{cfb_stars_stars}}/g, "✯".repeat(userObject.ratings.awards))
        .replace(/{{total_turns}}/g, userObject.stats.totalTurns)
        .replace(/{{round_turns}}/g, userObject.stats.gameTurns)
        .replace(/{{mvps}}/g, userObject.stats.mvps)
        .replace(/{{streak}}/g, userObject.stats.streak)
        .replace(/{{cfb_stars}}/g, userObject.stats.awards)
        .replace(/{{team}}/g, teamObject.team || "")
        .replace(/{{team_players_yesterday}}/g, teamObject.players || "0")
        .replace(/{{team_mercs_yesterday}}/g, teamObject.mercs || "0")
        .replace(/{{team_star_power_yesterday}}/g, teamObject.stars || "0")
        .replace(/{{team_territories_yesterday}}/g, teamObject.territories || "0")
        .replace(/{{team_logo}}/g, window.teamsObject[index].logo || "0");
    document.getElementById("playerCard").innerHTML = listHtml;
}

/*** Get Data Fxs ***/
function getUserInfo(resolve, reject) {
    try {
        doAjaxGetRequest('/api/me', 'UserLoader', function(userObject) {
                window.userObject = JSON.parse(userObject.response);
                //see if user has a team, if not, prompt them and halt
                let active_team = window.userObject.active_team || {
                    name: null
                };
                if (active_team.name == null) {
                    //select a new team 4 the season! whoohoo!
                    if (window.userObject.team == null) {
                        //select a team in general!! whoohoo!
                        select_team = "<p>Welcome! <br/> To get started, you will need to select a team.</p><form action=\"auth/join\" method=\"GET\" id=\"team-submit-form\"> <select name=\"team\" id=\"team\">";
                        teamsObject.forEach(function(team) {
                            select_team += "<option name=\"team\" value=\"" + team.id + "\">" + team.name + "</option>";
                        });
                        select_team += "</select><div id=\"team-submit-form-error\"></div></form>";
                        errorNotif('Select a Team', select_team, {
                            text: "Join",
                            action: function() {
                                doAjaxGetRequest(encodeURI('/auth/join?team='.concat(document.getElementById("team").value)), 'TeamSelector', function(status) {
                                    if (status.status == 200) {
                                        location.reload();
                                    }
                                }, function(status) {
                                    if (status.status == 409) {
                                        //user has team, 
                                    } else if (status.status == 403) {
                                        //team has no territories!
                                        document.getElementById('team-submit-form-error').innerHTML = "<br/><br/> <b style=\"color:red;\">Sorry, but this team is out of the running. Try another.</b>";
                                    } else {
                                        document.getElementsById('team-submit-form-error').innerHTML = "<br/><br/><b style=\"red\">Hmm, something went wrong. Try again?</b>";
                                    }
                                });
                            }
                        }, {
                            display: "none",
                            action: function() {}
                        });
                    } else {
                        //oh no! your team has been e l i m i n a t e d 
                        select_team = "<p>Oh no! Your team has been <b>eliminated.</b> Select a new one to play as: </p><form action=\"auth/join\" method=\"GET\" id=\"team-submit-form\"> <select name=\"team\" id=\"team\">";
                        teamsObject.forEach(function(team) {
                            select_team += "<option name=\"team\" value=\"" + team.id + "\">" + team.name + "</option>";
                        });
                        select_team += "</select><div id=\"team-submit-form-error\"></div></form>";
                        errorNotif('Select a Team', select_team, {
                            text: "Join",
                            action: function() {
                                doAjaxGetRequest(encodeURI('/auth/join?team='.concat(document.getElementById("team").value)), 'TeamSelector', function(status) {
                                    if (status.status == 200) {
                                        location.reload();
                                    }
                                }, function(status) {
                                    if (status.status == 409) {
                                        //user has team, 
                                    } else if (status.status == 403) {
                                        //team has no territories!
                                        document.getElementById('team-submit-form-error').innerHTML = "<br/><br/> <b style=\"color:red;\">Sorry, but this team is out of the running. Try another.</b>";
                                    } else {

                                    }
                                });
                            }
                        }, {
                            display: "none",
                        });
                    }
                    reject("No team");
                } else {
                    doAjaxGetRequest(encodeURI('/api/stats/team?team='.concat(window.userObject.team.name)).replace(/&/, '%26'), 'TeamLoader', function(teamObject) {
                        teamObject = JSON.parse(teamObject.response);
                        userObject = window.userObject;
                        drawPlayerCard(userObject, teamObject);
                        resolve("Okay");
                    }, function() {
                        reject("Error");
                    });
                }
            },
            function() {
                //display reddit login info
                document.getElementById("playerCard").classList.add("redditlogin");
                document.getElementById("reddit-login-top").style.display = "flex";
                document.getElementById("playerCard").innerHTML = "<a href=\"/login/reddit\"><div style=\"margin-top:50%;\" ><img src=\"images/reddit-logo.png\"><br/><br/>LOGIN</div></a>";
                resolve("Okay");
            });
    } catch {
        reject("Error setting up user card");
    }
}

function mapHover(event) {
    if (!event.target.matches('path')) return;
    type = event.type;
    switch (type) {
        case 'mouseover':
            event.preventDefault();
            document.getElementById("map-county-info").innerHTML = event.target.attributes["name"].value;
            document.getElementById("map-owner-info").innerHTML = event.target.attributes["owner"].value;
            event.target.style.fill = event.target.style.fill.replace('-primary', '-secondary');
            break;
        case 'mouseout':
            event.preventDefault();
            document.getElementById("map-county-info").innerHTML = event.target.attributes["name"].value;
            document.getElementById("map-owner-info").innerHTML = event.target.attributes["owner"].value;
            event.target.style.fill = event.target.style.fill.replace('-secondary', '-primary');
            break;
        default:
            break;
    }
}

function setupMapHover(resolve, reject) {
    document.addEventListener('mouseover', mapHover, false);
    document.addEventListener('mouseout', mapHover, false);
    resolve(true);
}

function removeMapHover(resolve, reject) {
    document.removeEventListener('mouseover', mapHover, false);
    document.removeEventListener('mouseout', mapHover, false);
    resolve(true);
}

function getTeamInfo(resolve, reject) {
    try {
        doAjaxGetRequest('/api/teams', 'Teams', function(team_data) {
            window.teamsObject = JSON.parse(team_data.response);
            //console.log(window.teamsObject);
            for (team in window.teamsObject) {
                document.documentElement.style
                    .setProperty('--'.concat(teamsObject[team].name.replace(/\W/g, '')).concat('-primary'), teamsObject[team].colors.primary);
                document.documentElement.style
                    .setProperty('--'.concat(teamsObject[team].name.replace(/\W/g, '')).concat('-secondary'), teamsObject[team].colors.secondary);
            }
            resolve(window.teamsObject);
        }, function() { reject("Error"); });
    } catch {
        reject("Error loading team info");
    }
}

function getTurns(resolve, reject) {
    try {
        doAjaxGetRequest('/api/turns', 'Turns', function(team_data) {
            window.turnsObject = JSON.parse(team_data.response);
            window.turn = window.turnsObject[window.turnsObject.length - 1];
            resolve(window.turnsObject);
        }, function() { reject("Error"); });
    } catch {
        reject("Error loading team info");
    }
}

function makeMove(id) {
    let endCycleColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').concat("");
    let endCycleColor05 = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-05').concat("");
    document.documentElement.style.setProperty("--theme-bg", "rgba(255,0,255,1)");
    document.documentElement.style.setProperty("--theme-bg-05", "rgba(255,0,255,0.5)");
    var timeStamp = Math.floor(Date.now() / 1000); //use timestamp to override cache
    doAjaxGetRequest("/auth/move?target=".concat(id, '&timestamp=', timeStamp.toString()), 'Make Move', function() {
        document.documentElement.style.setProperty('--theme-bg', endCycleColor);
        document.documentElement.style.setProperty('--theme-bg-05', endCycleColor05);
        errorNotif('Move Submitted', 'Your move has been submitted and received succesfully.', {
            text: "Okay"
        }, {
            display: "none"
        });
        return 0;
    }, function() {
        document.documentElement.style.setProperty('--theme-bg', 'rgba(255,0,0,1)');
        document.documentElement.style.setProperty('--theme-bg-05', 'rgba(255,0,0,0.5)');
        errorNotif('Could not make move', 'Hmm, couldn\'t set that as your move for the day.', {
            text: "Okay"
        }, {
            display: "none"
        });
    });
}

function drawActionBoard(resolve, reject) {
    let territories = window.territories;
    try {
        console.log("oh dear");
        let userteam = window.userObject.active_team.name;
        console.log(userteam);
        let attackable_territories = {};
        let defendable_territories = {};
        console.log(territories);
        for (i in territories) {
            if (territories[i].owner == userteam) {
                defendable_territories[territories[i].id] = territories[i];
                for (j in territories[i].neighbors) {
                    if (territories[i].neighbors[j].owner != userteam) {
                        attackable_territories[territories[i].neighbors[j].id] = territories[i].neighbors[j];
                    }
                }
            }
        }
        document.getElementById('action-container').style.display = "flex";
        let action_item = "<button onclick=\"makeMove({{id}});\">{{name}}</button>"
        for (k in attackable_territories) {
            document.getElementById('attack-list').innerHTML += action_item.replace(/{{name}}/, attackable_territories[k].name).replace(/{{id}}/, attackable_territories[k].id);
        }
        for (l in defendable_territories) {
            document.getElementById('defend-list').innerHTML += action_item.replace(/{{name}}/, defendable_territories[l].name).replace(/{{id}}/, defendable_territories[l].id);
        }
        console.log("Territory actions drawn");
        resolve("Okay");
    } catch (error) {
        console.log('could not do territory analysis');
        console.log(error);
        reject("Error");
    }
}

function resizeMap() {
    let width = document.getElementById('map-container').clientWidth;
    if (width < 1000) {
        document.getElementById('map').setAttribute('width', width);
        document.getElementById('map').setAttribute('height', width);
    }
    document.getElementById('map').setAttribute('preserveAspectRatio', 'xMinYMin');
    document.getElementById('map').setAttribute('viewBox', '0 0 650 650');
}

function seasonDayObject(season = 0, day = 0, autoup = false, fn, turnsObject) {
    //TODO: implement season stuff plz
    opt = "<option value=\"{{val}}\" {{sel}}>Season {{season}}, Day {{day}}</option>";
    days = "<select onchange=\"" + fn + "(this.value); \" name=\"day_select\" id=\"day_select\">";
    for (turnb in turnsObject) {
        if (turnb == 0) {
            continue;
        }
        turn = turnsObject.length - turnb - 1;
        sel = (turnsObject[turn].day == day || (day == 0 && turn == turnsObject.length - 1)) ? "selected" : "";
        days += opt.replace(/{{val}}/gi, turnsObject[turn].season + "." + turnsObject[turn].day).replace(/{{sel}}/, sel).replace(/{{season}}/, turnsObject[turn].season).replace(/{{day}}/, turnsObject[turn].day);
    }
    days += "</select>";
    if (autoup == false) {
        return "{{day}}".replace(/{{day}}/, days);
    } else {
        //yay! time to redraw stuffs: 
        document.getElementById('day_select').outerHTML = days;
    }
}

function drawMap(resolve, reject, source = 'territories', season = 0, day = 0) {
    // source should be either 'heat' or 'territories'
    var addendum = (season > 0 && day > 0) ? "?season=" + season + "&day=" + day : "";
    doAjaxGetRequest('/images/map.svg', 'Map', function(data) {
        document.getElementById('map-container').innerHTML = data.response;
        //now to fetch territory ownership or heat data
        switch (source) {
            case 'heat':
                doAjaxGetRequest('/api/heat' + addendum, 'Heat', function(heat_data) {
                    heat = JSON.parse(heat_data.response);
                    // find maximum
                    maxmin = getMaxMin(heat, "power");
                    for (territory in heat) {
                        red = Math.round(255 * (heat[territory].power - maxmin[1].power) / (maxmin[0].power - maxmin[1].power)) | 0;
                        document.getElementById('map').getElementById(heat[territory].territory.replace(/ /, "")).style.fill = "rgba(" + red + ", " + red + ", " + red + ", 0.5)";
                        document.getElementById('map').getElementById(heat[territory].territory.replace(/ /, "")).setAttribute('owner', heat[territory].winner);
                        document.getElementById("map-county-info").innerHTML = "Leaderboard";
                        document.getElementById("map-owner-info").innerHTML = seasonDayObject(1, day || 0, false, "page_leaderboard_update", window.turnsObject);
                        document.getElementById("map-owner-info").setAttribute('selectitem', 'true')
                    }
                    resizeMap();
                    resolve(heat);
                }, function() {
                    reject("Error");
                });
                break;
            case 'territories':
                doAjaxGetRequest('/api/territories' + addendum, 'Territories', function(territory_data) {
                    window.territories = JSON.parse(territory_data.response);
                    for (territory in window.territories) {
                        document.getElementById('map').getElementById(window.territories[territory].name.replace(/ /, "")).style.fill = 'var(--'.concat(territories[territory].owner.replace(/\W/g, '').concat('-primary)'));
                        document.getElementById('map').getElementById(window.territories[territory].name.replace(/ /, "")).setAttribute('owner', territories[territory].owner);
                    }
                    resizeMap();
                    resolve(window.territories);
                }, function() {
                    reject("Error");
                });
                break;
            default:
                break;
        }
    });
}


function drawUserTurnHistory(playerObject) {
    let turnHistoryObject = playerObject.turns;
    let display_headings = ["season", "day", "stars", "team", "territory", "mvp"];

    var obj = {
        // Quickly get the headings
        headings: ["Season", "Day", "Stars", "Team", "Territory", "MVP"],

        // data array
        data: []
    };

    // Loop over the objects to get the values
    for (var i = 0; i < turnHistoryObject.length; i++) {

        obj.data[i] = [];

        for (var p in turnHistoryObject[i]) {
            if (turnHistoryObject[i].hasOwnProperty(p) && display_headings.indexOf(p) != -1) {
                obj.data[i].push(turnHistoryObject[i][p]);
            }
        }
    }
    try {
        window.datatable.destroy();
    } catch {
        // don't do anything, nor output to table ;)
    } finally {
        window.datatable = new DataTable("#history-table", {
            data: obj,
            columns: obj.columns,
            searchable: false,
            perPageSelect: false,
            footer: false,
            labels: {
                info: "",
            }
        });
    }
}

function drawLeaderboard(season, day) {
    var addendum = (season > 0 && day > 0) ? "?season=" + season + "&day=" + day : "";
    doAjaxGetRequest('/api/stats/leaderboard' + addendum, 'leaderboard request', function(leaderboard_data) {
        let leaderboardObject = JSON.parse(leaderboard_data.response);
        let display_headings = ["rank", "name", "territoryCount", "playerCount", "mercCount", "starPower", "efficiency"];

        var obj = {
            // Quickly get the headings
            headings: ["Rank", "Name", "Territories", "Players", "Mercenaries", "Stars", "Efficiency"],

            // data array
            data: []
        };

        // Loop over the objects to get the values
        for (var i = 0; i < leaderboardObject.length; i++) {

            obj.data[i] = [];

            for (var p in leaderboardObject[i]) {
                if (leaderboardObject[i].hasOwnProperty(p) && display_headings.indexOf(p) != -1) {
                    if (p == 'name') {
                        obj.data[i].push("<a href=\"/team/" + leaderboardObject[i][p] + "\"><img width='30px' src='" + leaderboardObject[i]['logo'] + "'/>".concat(leaderboardObject[i][p]));
                    } else {
                        obj.data[i].push(leaderboardObject[i][p]);
                    }
                }
            }
        }

        try {
            window.datatable.destroy();
        } catch {
            // don't do anything, nor output to table ;)
        } finally {
            window.datatable = new DataTable("#leaderboard-table", {
                data: obj,
                columns: obj.columns,
                searchable: false,
                perPageSelect: false,
                footer: false,
                labels: {
                    info: "",
                }
            });
        }
    });
}

function page_leaderboard_update(seasonday) {
    //decouple to ints
    seasonday = seasonday.split(".");
    season = Number(seasonday[0]) || 0;
    day = Number(seasonday[1]) || 0;
    drawLeaderboard(season, day, templateLeaderboard, contentTag);
    drawMap(console.log, console.log, 'heat', season, day);
}

function page_info(contentTag) {
    updateLoaderVisibility();
    var templateInfo = document.getElementById("templateInfo");
    contentTag.innerHTML += templateInfo.innerHTML;
    console.log(contentTag);
}

function page_leaderboard(contentTag) {
    /* objects:
        1. map (heat)
        2. leaderboard

    First, we fetch the heat data for turn
        */
    var templateLeaderboard = document.getElementById("templateLeaderboard");
    templateLeaderboard = templateLeaderboard.innerHTML;
    var templateMap = document.getElementById("templateMap");
    templateMap = templateMap.innerHTML;
    contentTag.innerHTML += templateMap;
    contentTag.innerHTML += templateLeaderboard;
    drawLeaderboard(0, 0, templateLeaderboard, contentTag);
    let leaderboard = new Promise((resolve, reject) => {
        getTurns(resolve, reject);
        getTeamInfo(resolve, reject);
    }).then(() => {
        return new Promise((resolve, reject) => {
            drawMap(resolve, reject, "heat");
        })
    }).then(() => {
        return new Promise((resolve, reject) => {
            removeMapHover(resolve, reject);
        })
    });

}

function page_territory(contentTag, t_object) {
    territory = t_object.name;
    season = t_object.season;
    day = t_object.day;
    contentTag.innerHTML = document.getElementById('templateTerritoryComplete').innerHTML;
    if (season > 0 && day > 0) {
        //attempt to fetch the data for that day & season
        doAjaxGetRequest('/api/territory/turn?season=' + season + '&day=' + day + '&territory=' + territory,
            'TerritoryFetch',
            function(territoryData) {
                //Fill the table!
                territoryTurn = JSON.parse(territoryData.response);
                territoryCompleteHeader = document.getElementById('templateTerritoryCompleteHeader').innerHTML;
                document.getElementById('territoryCompleteHeader').innerHTML = territoryCompleteHeader
                    .replace(/{{TerritoryName}}/, decodeURIComponent(territory))
                    .replace(/{{owner}}/, territoryTurn.occupier)
                    .replace(/{{winner}}/, territoryTurn.winner)
                let display_headings = ["team", "players", "power", "chance"];
                var obj = {
                    // Quickly get the headings
                    headings: ["Team", "Players", "Power", "Chance"],

                    // data array
                    data: []
                };

                chart = {
                    team: [],
                    power: [],
                    background: [],
                    hover: []
                };

                // Loop over the objects to get the values
                for (var i = 0; i < territoryTurn.teams.length; i++) {

                    chart.team.push(territoryTurn.teams[i].team);
                    chart.power.push(territoryTurn.teams[i].power);
                    chart.background.push(territoryTurn.teams[i].color);
                    chart.hover.push(territoryTurn.teams[i].secondaryColor);

                    obj.data[i] = [];

                    for (var p in territoryTurn.teams[i]) {
                        if (territoryTurn.teams[i].hasOwnProperty(p) && display_headings.indexOf(p) != -1) {
                            if (p == 'chance') {
                                obj.data[i].push(territoryTurn.teams[i][p].toFixed(2));
                            } else if (p == 'team') {
                                obj.data[i].push("<a href=\"/team/{{team}}\" >{{team}}</a>".replace(/{{team}}/gi, territoryTurn.teams[i][p]));
                            } else {
                                obj.data[i].push(territoryTurn.teams[i][p]);
                            }
                        }
                    }
                }
                try {
                    window.datatable.destroy();
                } catch {
                    // don't do anything, nor output to table ;)
                } finally {
                    window.datatable = new DataTable("#owner-table", {
                        data: obj,
                        columns: obj.columns,
                        searchable: false,
                        perPageSelect: false,
                        footer: false,
                        labels: {
                            info: "",
                        }
                    });
                }
                territoryPie = document.getElementById('territory-complete-pie');
                Chart.defaults.global.defaultFontColor = 'white';
                new Chart(territoryPie, {
                    "type": "doughnut",
                    "data": {
                        "labels": chart.team,
                        "datasets": [{
                            "label": "Win Odds",
                            "data": chart.power,
                            "backgroundColor": chart.background,
                            "hoverBackgroundColor": chart.hover
                        }],
                        font: {
                            color: 'white',
                        }
                    }
                });
                let display_headings_players = ['team', 'player', 'stars', 'weight', 'multiplier', 'power'];
                var obj_players = {
                    // Quickly get the headings
                    headings: ['Team', 'Player', 'Stars', 'Weight', 'Multiplier', 'Power'],

                    // data array
                    data: []
                };
                for (var i = 0; i < territoryTurn.players.length; i++) {

                    obj_players.data[i] = [];

                    for (var p in territoryTurn.players[i]) {
                        if (territoryTurn.players[i].hasOwnProperty(p) && display_headings_players.indexOf(p) != -1) {
                            if (p == 'team') {
                                obj_players.data[i].push("<a href=\"/team/{{team}}\" >{{team}}</a>".replace(/{{team}}/gi, territoryTurn.players[i][p]));
                            } else if (p == 'player') {
                                obj_players.data[i].push("<a href=\"/player/{{player}}\" >{{player}}</a>".replace(/{{player}}/gi, territoryTurn.players[i][p]));
                            } else {
                                obj_players.data[i].push(territoryTurn.players[i][p]);
                            }
                        }
                    }
                }
                try {
                    window.datatable2.destroy();
                } catch {
                    // don't do anything, nor output to table ;)
                } finally {
                    console.log(obj_players);
                    window.datatable2 = new DataTable("#territory-complete-players-table", {
                        data: obj_players,
                        columns: obj_players.columns,
                        searchable: false,
                        perPageSelect: false,
                        footer: false,
                        labels: {
                            info: "",
                        }
                    });
                }

            }, console.log
        )
    }
}

function page_territory_cover(contentTag, tname) {
    let territory_history = new Promise((resolve, reject) => {
        getTurns(resolve, reject);
    }).then(() => {
        //get MaxMin
        turn_maxmin = getMaxMin(window.turnsObject, "season");
        max_season = turn_maxmin[0].season;
        //fetch territory's history ;)
        doAjaxGetRequest("/api/territory/history?territory=" + tname + "&season=" + max_season, 'Territory Cover', function(territoryResponse) {
            var templateTerritoryHistory = document.getElementById("templateTerritoryHistory");
            var box = document.getElementById("templateTerritoryHistoryBox");
            var str = "";
            territoryHistoryObject = JSON.parse(territoryResponse.response);
            for (obj in territoryHistoryObject) {
                var objr = territoryHistoryObject.length - obj - 1;
                str += box.innerHTML.replace(/{{day}}/gi, territoryHistoryObject[objr].day).replace(/{{team}}/, territoryHistoryObject[objr].owner).replace(/{{season}}/, territoryHistoryObject[objr].season);
            }
            contentTag.innerHTML = templateTerritoryHistory.innerHTML.replace(/{{objs}}/, str).replace(/{{TerritoryName}}/gi, decodeURIComponent(tname));
        }, console.log)
    });
}

function page_index(contentTag) {
    /*objects:
        1. map
        2. userinfo / team info
        3. roll
        */
    var templateMap = document.getElementById("templateMap");
    var templateRoll = document.getElementById("templateRoll");
    contentTag.innerHTML += templateMap.innerHTML;
    contentTag.innerHTML += templateRoll.innerHTML;

    let index = Promise.all([new Promise(drawMap), new Promise(getTeamInfo)])
        .then((values) => {
            console.log(values);
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                setupMapHover(resolve, reject);
            })
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                getUserInfo(resolve, reject);
            })
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                drawActionBoard(resolve, reject);
            })
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                getTurns(resolve, reject);
                setUpCounter();
            })
        })
        .catch((values) => { console.log(values) });
}

function drawOddsPage(junk) {
    // get value of team_select
    // get value of day_select and break into season, day
    // show heat map, odds map
    // GET /team/odds?team=Texas&day=1&season=1
    // GET doAjaxGetRequest('/images/map.svg', 'Map', function(data) {
    // add all the chances together to get Expected terrritories,
    var team = document.getElementById('team_select').value;
    var seasonday = document.getElementById('day_select').value.split('.');
    var day = seasonday[1];
    var season = seasonday[0];
    document.getElementById("heat-notif").innerHTML = "Where " + team + " deployed forces";
    document.getElementById("odds-notif").innerHTML = "Where " + team + " had the highest odds";
    doAjaxGetRequest('/api/team/odds?team=' + team.replace('&', '%26') + '&day=' + day + '&season=' + season, 'oddsfetch', function(oddsObject) {
        var territory_count = 0;
        var territory_expected = 0;
        var survival_odds = 1;
        oddsObject = JSON.parse(oddsObject.response);
        var obj = {
            // Quickly get the headings
            headings: ["Territory", "Owner", "MVPs", "Players", "1✯", "2✯", "3✯", "4✯", "5✯", "Team Power", "Territory Power", "Chance"],

            // data array
            data: []
        };
        let player_mm = getMaxMin(oddsObject, 'players');
        var chance_max;
        var chance_min;
        for (var i = 0; i < oddsObject.length; i++) {
            if (chance_max == null || oddsObject[i]['chance'] > chance_max['chance'])
                chance_max = oddsObject[i];
            if (chance_min == null || oddsObject[i]['chance'] < chance_min['chance'])
                chance_min = oddsObject[i];
        }
        let chance_mm = [chance_max, chance_min];
        document.getElementById('heat-map').innerHTML = window.mapTemplate.replace(/id="/gi, 'id="heatmap_');
        document.getElementById('odds-map').innerHTML = window.mapTemplate.replace(/id="/gi, 'id="oddmap_');
        for (i in oddsObject) {
            territory_count += (oddsObject[i].winner.replace(/\W/g, '') == team.replace(/\W/g, '')) ? 1 : 0;
            territory_expected += oddsObject[i].chance;
            survival_odds = survival_odds * (1 - oddsObject[i].chance);
            player_red = Math.round((oddsObject[i].players - player_mm[1].players) / (player_mm[0].players - player_mm[1].players)) | 0;
            odds_red = Math.round((oddsObject[i].chance - chance_mm[1].chance) / (chance_mm[0].chance - chance_mm[1].chance)) | 0;
            document.getElementById("heatmap_".concat(oddsObject[i].territory.replace(/ /, ""))).style.fill = "rgba(" + player_red + ", " + player_red + ", " + player_red + ", 0.5)";
            document.getElementById("oddmap_".concat(oddsObject[i].territory.replace(/ /, ""))).style.fill = "rgba(" + odds_red + ", " + odds_red + ", " + odds_red + ", 0.5)";
            obj.data.push([oddsObject[i]['territory'],
                oddsObject[i]["owner"],
                oddsObject[i]["mvp"],
                oddsObject[i]["players"],
                oddsObject[i]["starBreakdown"]["ones"],
                oddsObject[i]["starBreakdown"]["twos"],
                oddsObject[i]["starBreakdown"]["threes"],
                oddsObject[i]["starBreakdown"]["fours"],
                oddsObject[i]["starBreakdown"]["fives"],
                oddsObject[i]["teamPower"],
                oddsObject[i]["territoryPower"],
                oddsObject[i]["chance"].toFixed(2)
            ]);
        }
        //resizeMap();
        try {
            window.datatable.destroy();
        } catch {
            // don't do anything, nor output to table ;)
        } finally {
            window.datatable = new DataTable("#odds-players-table", {
                data: obj,
                columns: obj.columns,
                searchable: false,
                perPageSelect: false,
                footer: false,
                labels: {
                    info: "",
                }
            });
        }

        document.getElementById('odds-survival').innerHTML = Math.floor(100 * (1 - survival_odds)) + "%";
        document.getElementById('odds-expect').innerHTML = territory_expected.toFixed(2);
        document.getElementById('odds-actual').innerHTML = territory_count.toFixed(2);
    });
}

function page_odds(contentTag) {
    // We just dump the grid and such, then let the user sort out what they want
    contentTag.innerHTML = document.getElementById('templateOdds').innerHTML;
    doAjaxGetRequest('/images/map.svg', 'Map', function(data) { window.mapTemplate = data.response; });
    // we now populate the two lists with options, need a list of teams and a list of turns
    Promise.all([new Promise(getTeamInfo), new Promise((resolve, reject) => {
            getTurns(resolve, reject);
        })])
        .then((values) => {
            //make pretty thingy 
            str = '<select onchange="drawOddsPage(this.value); " name="team_select" id="team_select">';
            for (i in values[0]) {
                str += "<option name=\"team_select\" value=\"" + values[0][i].name + "\">" + values[0][i].name + "</option>";
            }
            document.getElementById("map-owner-info").innerHTML = seasonDayObject(0, 0, autoup = false, 'drawOddsPage', values[1]);
            document.getElementById("map-owner-teams").innerHTML = str;
            document.getElementById("map-owner-info").setAttribute('selectitem', 'true')
            console.log(values);
        });
}


function drawTeamPage(teamsObject, teamTurnsObject, team) {
    for (x in teamsObject) {
        console.log(team, teamsObject[x].name);
        if (teamsObject[x].name.replace(/\W/g, '') == decodeURIComponent(team).replace(/\W/g, '')) {
            document.getElementById("team-logo").setAttribute('src', teamsObject[x].logo);
            break;
        }
    }

    teamTurnsObject = JSON.parse(teamTurnsObject.response);
    var lastTeamTurn = teamTurnsObject[teamTurnsObject.length - 1];
    document.getElementById('team-prev-players').innerHTML = "Players:" + lastTeamTurn.players;
    document.getElementById('team-prev-stars').innerHTML = "Star power:" + lastTeamTurn.starPower;
    let display_headings = ["season", "day", "territories", "players", "starPower", "effectivePower"];

    var power_data = [];

    var player_counts = [
        [],
        [],
        [],
        [],
        []
    ];

    var obj = {
        // Quickly get the headings
        headings: ["Season", "Day", "Players", "Territories", "Star Power", "Effective Power"],

        // data array
        data: []
    };

    // Loop over the objects to get the values
    for (var i = 0; i < teamTurnsObject.length; i++) {
        obj.data[i] = [];
        power_data.push({ x: i, y: teamTurnsObject[i]['players'] });
        player_counts[0].push({ x: i, y: teamTurnsObject[i]['starbreakdown']['ones'] });
        player_counts[1].push({ x: i, y: teamTurnsObject[i]['starbreakdown']['twos'] });
        player_counts[2].push({ x: i, y: teamTurnsObject[i]['starbreakdown']['threes'] });
        player_counts[3].push({ x: i, y: teamTurnsObject[i]['starbreakdown']['fours'] });
        player_counts[4].push({ x: i, y: teamTurnsObject[i]['starbreakdown']['fives'] });
        for (var p in teamTurnsObject[i]) {
            if (teamTurnsObject[i].hasOwnProperty(p) && display_headings.indexOf(p) != -1) {
                obj.data[i].push(teamTurnsObject[i][p]);
            }
        }
    }
    //first we fill the charts
    Chart.defaults.global.defaultFontColor = 'black';
    var starChart = new Chart(document.getElementById("star-power-history"), {
        type: 'line',
        backgroundColor: 'white',
        data: {
            datasets: [{
                label: 'Star Power',
                data: power_data,
                borderColor: 'rgba(255,0,0,0.5)',
                backgroundColor: 'rgba(255,0,0,0)'
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    scaleLabel: {
                        display: true,
                        labelString: 'Day'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Star Power'
                    }
                }]
            }
        }
    });
    var playerHistory = new Chart(document.getElementById("player-history"), {
        type: 'line',
        data: {
            datasets: [{
                    label: 'Ones',
                    data: player_counts[0],
                    borderColor: 'rgba(255,0,0,0.5)',
                    backgroundColor: 'rgba(255,0,0,0)'
                },
                {
                    label: 'Twos',
                    data: player_counts[1],
                    borderColor: 'rgba(0,255,0,0.5)',
                    backgroundColor: 'rgba(255,0,0,0)'
                },
                {
                    label: 'Threes',
                    data: player_counts[2],
                    borderColor: 'rgba(0,0,255,0.5)',
                    backgroundColor: 'rgba(255,0,0,0)'
                },
                {
                    label: 'Fours',
                    data: player_counts[3],
                    borderColor: 'rgba(0,255,255,0.5)',
                    backgroundColor: 'rgba(255,0,0,0)'
                },
                {
                    label: 'Fives',
                    data: player_counts[4],
                    borderColor: 'rgba(255,0,255,0.5)',
                    backgroundColor: 'rgba(255,0,0,0)'
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    scaleLabel: {
                        display: true,
                        labelString: 'Day'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Players'
                    }
                }]
            }
        }
    });
    //then we fill the table
    try {
        window.datatable.destroy();
    } catch {
        // don't do anything, nor output to table ;)
    } finally {
        window.datatable = new DataTable("#team-turns-table", {
            data: obj,
            columns: obj.columns,
            searchable: false,
            perPageSelect: false,
            footer: false,
            labels: {
                info: "",
            }
        });
    }
    //then we fill the header
}


function page_team(contentTag, team) {
    // load the teams info and save to tag
    // /api/stats/team/history
    var templateTeam = document.getElementById("templateTeam");
    contentTag.innerHTML += templateTeam.innerHTML;
    document.getElementById('team-header').innerHTML = "<h1>" + decodeURIComponent(team) + "</h1>";
    var templateTeamPage = document.getElementById("templateTeamPage");
    let team_page_2 = new Promise((resolve, reject) => {
            getTeamInfo(resolve, reject);
        })
        .then((values) => {
            doAjaxGetRequest('/api/stats/team/history?team=' + team.replace('&', '%26'), 'TeamFetch', function(data) {
                drawTeamPage(values, data, team);
            });
        })
}

function page_player(contentTag, pid) {
    //fetch player info
    let leaderboard = new Promise((resolve, reject) => {
        getTeamInfo(resolve, reject);
    });
    var templatePlayerCardWrap = document.getElementById("templatePlayerCardWrap");
    var templateHistory = document.getElementById("templateHistory");
    contentTag.innerHTML += templatePlayerCardWrap.innerHTML;
    contentTag.innerHTML += templateHistory.innerHTML;
    doAjaxGetRequest('/api/player?player=' + pid, 'UserLoader', function(playerObject) {
            //Get team
            playerObject = JSON.parse(playerObject.response);
            console.log(playerObject);
            let active_team = playerObject.team || {
                name: null
            };
            if (active_team.name == null) {
                document.getElementById('playerCard').innerHTML = "Sorry, user doesn't have a team yet.";
            } else {
                doAjaxGetRequest(encodeURI('/api/stats/team?team='.concat(playerObject.team.name)).replace(/&/, '%26'), 'TeamLoader', function(pteamObject) {
                    pteamObject = JSON.parse(pteamObject.response);
                    drawPlayerCard(playerObject, pteamObject);
                    drawUserTurnHistory(playerObject);
                }, function() {});
            }

        },
        function() {
            document.getElementById('playerCard').innerHTML = "Hmm, user does not exist";
        });


}

function handleNewPage(title, contentTag, call, vari) {
    contentTag.innerHTML = "";
    document.title = "Aggie Risk | " + title;
    clearInterval(window.pulse);
    call(contentTag, vari);
}

class Router {
    /*constructor() {
        routes = [];

        mode = null;

        root = '/';
    }*/

    constructor(options) {
        this.routes = [];

        this.mode = null;

        this.root = '/';
        this.mode = window.history.pushState ? 'history' : 'hash';
        if (options.mode) this.mode = options.mode;
        if (options.root) this.root = options.root;



        this.add = (path, cb) => {
            this.routes.push({ path, cb });
            return this;
        };

        this.remove = path => {
            for (let i = 0; i < this.routes.length; i += 1) {
                if (this.routes[i].path === path) {
                    this.routes.slice(i, 1);
                    return this;
                }
            }
            return this;
        };

        this.flush = () => {
            this.routes = [];
            return this;
        };

        this.clearSlashes = path =>
            path
            .toString();
        //  .replace(/\/$/, '')
        // .replace(/^\//, '');

        this.getFragment = () => {
            let fragment = '';
            if (this.mode === 'history') {
                fragment = this.clearSlashes(decodeURI(window.location.pathname + window.location.search));
                console.log(fragment);
                fragment = fragment.replace(/\?(.*)$/, '');
                fragment = this.root !== '/' ? fragment.replace(this.root, '') : fragment;
            } else {
                const match = window.location.href.match(/(.*)$/);
                fragment = match ? match[1] : '';
            }
            return this.clearSlashes(fragment);
        };

        this.navigate = (path = '') => {
            if (this.mode === 'history') {
                window.history.pushState(null, null, this.root + this.clearSlashes(path));
            } else {
                window.location.href = `${window.location.href.replace(/(.*)$/, '')}#${path}`;
            }
            return this;
        };

        this.listen = () => {
            clearInterval(this.interval);
            this.interval = setInterval(this.interval, 50);
        };

        this.interval = () => {
            if (this.current === this.getFragment() || this.current + "#" === this.getFragment()) return;
            this.current = this.getFragment();

            this.routes.some(route => {
                const match = this.current.match(route.path);
                if (match) {
                    match.shift();
                    route.cb.apply({}, match);
                    return match;
                }
                return false;
            });
        };
        this.listen();
    }
}

const router = new Router({
    mode: 'hash',
    root: '/'
});

var contentTag = document.getElementById('content-wrapper');

router
    .add('/leaderboard', () => {
        handleNewPage('Leaderboard', contentTag, page_leaderboard);
    })
    .add('/odds', () => {
        handleNewPage('Odds', contentTag, page_odds);
    })
    .add('/info', () => {
        handleNewPage('Information', contentTag, page_info);
    })
    .add('/team/(.*)', (team) => {
        handleNewPage(team, contentTag, page_team, team.replace('#', ''));
    })
    .add('/territory/(.*)/(.*)/(.*)', (territoryName, season, day) => {
        console.log(territoryName, season, day);
        handleNewPage(territoryName, contentTag, page_territory, { name: territoryName, season: season.replace('#', ''), day: day.replace('#', '') });
    })
    .add('/territory/(.*)', (territoryName) => {
        handleNewPage(territoryName, contentTag, page_territory_cover, territoryName);
    })
    .add('/bug', () => {
        var Browserinfo = {
            init: function() {
                this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
                this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "an unknown version";
                this.OS = this.searchString(this.dataOS) || "an unknown OS";
                this.cookies = navigator.cookieEnabled;
                this.language = (this.browser === "Explorer" ? navigator.userLanguage : navigator.language);
                this.colors = window.screen.colorDepth;
                this.browserWidth = window.screen.width;
                this.browserHeight = window.screen.height;
                this.java = (navigator.javaEnabled() == 1 ? true : false);
                this.codeName = navigator.appCodeName;
                this.cpu = navigator.oscpu;
                this.useragent = navigator.userAgent;
                this.plugins = navigator.plugins;
                this.ipAddress();
            },
            searchString: function(data) {
                for (var i = 0; i < data.length; i++) {
                    var dataString = data[i].string;
                    var dataProp = data[i].prop;
                    this.versionSearchString = data[i].versionSearch || data[i].identity;
                    if (dataString) {
                        if (dataString.indexOf(data[i].subString) != -1) return data[i].identity;
                    } else if (dataProp) return data[i].identity;
                }
            },
            searchVersion: function(dataString) {
                var index = dataString.indexOf(this.versionSearchString);
                if (index == -1) return;
                return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
            },

            ipAddress: function() {

                if (navigator.javaEnabled() && (navigator.appName != "Microsoft Internet Explorer")) {
                    vartool = java.awt.Toolkit.getDefaultToolkit();
                    addr = java.net.InetAddress.getLocalHost();
                    this.host = addr.getHostName();
                    this.ip = addr.getHostAddress();
                } else {
                    this.host = false;;
                    this.ip = false;
                }

            },

            screenSize: function() {
                var myWidth = 0,
                    myHeight = 0;
                if (typeof(window.innerWidth) == 'number') {
                    //Non-IE
                    this.browserWidth = window.innerWidth;
                    this.browserHeight = window.innerHeight;
                } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
                    //IE 6+ in 'standards compliant mode'
                    this.browserWidth = document.documentElement.clientWidth;
                    this.browserHeight = document.documentElement.clientHeight;
                } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
                    //IE 4 compatible
                    this.browserWidth = document.body.clientWidth;
                    this.browserHeight = document.body.clientHeight;
                }
            },
            dataBrowser: [{
                string: navigator.userAgent,
                subString: "Chrome",
                identity: "Chrome"
            }, {
                string: navigator.userAgent,
                subString: "OmniWeb",
                versionSearch: "OmniWeb/",
                identity: "OmniWeb"
            }, {
                string: navigator.vendor,
                subString: "Apple",
                identity: "Safari",
                versionSearch: "Version"
            }, {
                prop: window.opera,
                identity: "Opera"
            }, {
                string: navigator.vendor,
                subString: "iCab",
                identity: "iCab"
            }, {
                string: navigator.vendor,
                subString: "KDE",
                identity: "Konqueror"
            }, {
                string: navigator.userAgent,
                subString: "Firefox",
                identity: "Firefox"
            }, {
                string: navigator.vendor,
                subString: "Camino",
                identity: "Camino"
            }, { // for newer Netscapes (6+)
                string: navigator.userAgent,
                subString: "Netscape",
                identity: "Netscape"
            }, {
                string: navigator.userAgent,
                subString: "MSIE",
                identity: "Explorer",
                versionSearch: "MSIE"
            }, {
                string: navigator.userAgent,
                subString: "Gecko",
                identity: "Mozilla",
                versionSearch: "rv"
            }, { // for older Netscapes (4-)
                string: navigator.userAgent,
                subString: "Mozilla",
                identity: "Netscape",
                versionSearch: "Mozilla"
            }],
            dataOS: [{
                string: navigator.platform,
                subString: "Win",
                identity: "Windows"
            }, {
                string: navigator.platform,
                subString: "Mac",
                identity: "Mac"
            }, {
                string: navigator.userAgent,
                subString: "iPhone",
                identity: "iPhone/iPod"
            }, {
                string: navigator.platform,
                subString: "Linux",
                identity: "Linux"
            }]

        }
        Browserinfo.init();

        BrowserInfo = {
            os: Browserinfo.OS,
            browser: Browserinfo.browser,
            version: Browserinfo.version,
            cookies: Browserinfo.cookies,
            language: Browserinfo.language,
            browserWidth: Browserinfo.browserWidth,
            browserHeight: Browserinfo.browserHeight,
            java: Browserinfo.java,
            colors: Browserinfo.colors,
            codeName: Browserinfo.codeName,
            host: Browserinfo.host,
            cpu: Browserinfo.cpu,
            useragent: Browserinfo.useragent,
            cookies: document.cookie
        };

        bug_form = document.getElementById("bug_form");
        bug_form = bug_form.innerHTML;
        bug_form = bug_form.replace(/{{uinf}}/, encodeURI(JSON.stringify(BrowserInfo)))
            .replace(/{{errors}}/, encodeURI(JSON.stringify(errorNotifications))).replace(/{{pending}}/, encodeURI(JSON.stringify(outstandingRequests)));
        errorNotif('Bug Report', bug_form, {
            text: "Okay",
            action: function() {
                console.log("Submit");
            },
        }, {
            display: "none",
            action: function() {}
        });
    })
    .add('/player/(.*)', (pid) => {
        handleNewPage(pid, contentTag, page_player, pid);
    })
    .add('/', () => {
        // general controller
        handleNewPage('Home', contentTag, page_index);
    })
    .add('', () => {
        console.log('404');
    });

function doDate() {
    var templateRollInfo = document.getElementById("templateRollInfo");
    templateRollInfo = templateRollInfo.innerHTML;
    var now = new Date();
    var str = ""
    var difference = rollTime - now;
    var days = 0;
    var days = Math.floor(difference / 1000 / 24 / 60 / 60)
    difference -= days * 1000 * 24 * 60 * 60;
    var hours = Math.floor(difference / 1000 / 60 / 60);
    difference -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(difference / 1000 / 60);
    difference -= minutes * 1000 * 60;
    var seconds = Math.floor(difference / 1000);
    difference -= seconds * 1000;
    str += templateRollInfo
        .replace(/{{day}}/, window.turn.day)
        .replace(/{{days}}/, pad(days, 'days', false, false, 0))
        .replace(/{{hours}}/, pad(hours, 'hours', false, false, days))
        .replace(/{{minutes}}/, pad(minutes, 'minutes', true, false, hours + days))
        .replace(/{{seconds}}/, pad(seconds, 'seconds', true, true, minutes + days + hours));
    document.getElementById("rollInfo").innerHTML = str;
}

/*** UTILITIES ***/

function setUpCounter() {
    window.pulse = setInterval(doDate, 1000);
}

function pad(number, notion, final, next, prev) {
    if (number != 0 || prev != 0) {
        return (next == true && prev != 0 ? "and " : "") + (number < 10 ? "0" : "") + number + " " + notion + (final == false ? ", " : " ");
    } else {
        return '';
    }
    if (prev == 0 && number == 0) {
        rollTime.setUTCDate(rollTime.getUTCDate() + 1)
    }
}

function link_is_external(link_element) {
    return (link_element.host !== window.location.host);
}

function resizeGlobal() {
    try {
        resizeMap();
    } catch {
        //we're not on the main page. :shrug:
    }
}

function getMaxMin(arr, prop) {
    var max;
    var min;
    for (var i = 0; i < arr.length; i++) {
        if (max == null || parseInt(arr[i][prop]) > parseInt(max[prop]))
            max = arr[i];
        if (min == null || parseInt(arr[i][prop]) < parseInt(min[prop]))
            min = arr[i];
    }
    return [max, min];
}
// @license-end