//
//Hauptdatei zum Einlesen der Daten & Clustering
//

//Daten-Input und Datentypfestlegung (datetime muss im Format JahrMonatTagStunde (2020123109) vorliegen, immer vom 01.01. 0 Uhr des Jahres beginnen und genau ein vollstaendiges Jahr bis zum 31.12. 23 Uhr des Jahres sein !!!)


d3.csv("data.csv", function (d) {
    return {
        datetime: +d.datetime,
        temp: +d.temp,
    };
})
    .then(function (data) {

        // ermittelt, ob das Jahr ein Schaltjahr ist oder nicht (datetime muss im Format JahrMonatTagStunde (2020123109) vorliegen!)
        const s_jahr = (data[0].datetime / 100 - 101) / 10000;
        let tage_des_jahres = 365;
        if (((s_jahr % 4) === 0) && (((s_jahr % 100) !== 0) || (s_jahr % 400) === 0)) {
            tage_des_jahres = 366;																	// Schaltjahr
        }

        const durchschnitte_array = [];																// Array aus 365/366 Durchschnittstemperaturen ueber welchem kmeans laeuft
        const tage_array = [];																		// Array aus Objekten fuer jeden Tag des Jahres im Format [{date},{avg_temp}]

        //For Schleife um average Temperatur zu ermitteln und in ein Array von Objekten zu uebergeben
        // fuer alle 365/366 Tage
        for (day = 0; day < tage_des_jahres; day++) {

            let durchschnitt = 0;
            // fuer den Tag 'day' alle 24 Stunden
            for (hour = 0; hour < 24; hour++) {

                var row = day * 24 + hour;
                durchschnitt = durchschnitt + data[row].temp;										// addiere Durchschnitte des Tages auf
            }

            durchschnitt = durchschnitt / 24.0;
            durchschnitt = Math.round(durchschnitt * 10) / 10;										//runden der Temperaturen auf eine Nachkommastelle
            durchschnitte_array.push(durchschnitt);

            var row = day * 24;
            const dateString = (data[row].datetime / 100).toString() 								// betrachten Stunde 0 des Tages und dividieren durch 100 um nur bis auf den Tag zu verfeinern, --> String
            const jsDate = new Date(dateString.substr(0, 4), dateString.substr(4, 2) - 1, dateString.substr(6, 2));						// Zerlegen in Jahr, Monat, Tag (Monat -1 fuer new Date)
            tage_array.push({'date': jsDate, 'avg_temp': durchschnitt});							//Formatfestlegung:	'date' bestehend aus Jahr, Monat, Tag

        }

// Cluster (Versuch, kmeans selbst zu implementieren)

        const avgMin = Math.min(... durchschnitte_array);
        const avgMax = Math.max(... durchschnitte_array);
        let avgDistance;
        let stepValue;
        let pushValue;
        var centro = [];
        var cluster_points = 6;																		// Anzahl der Cluster = 6	(minimum 2; maximum 10) 	(evtl. als Nutzereingabe 1-9 zulaessig)

        avgDistance = avgMax - avgMin;                                                              // Abstand zwischen niedrigstem und hoechsten Wert
        stepValue = avgDistance / (cluster_points - 1);

        for(i = 0; i < cluster_points; i++) {                                                       // pusht alle "fair" aufgeteilten Centroide
            pushValue = avgMin + (i * stepValue);
            centro.push(pushValue);
        }


        // // Random Clustercentroide aus den ermittelten Durchchnitten generieren
        // for (centroide = 1; centroide <= cluster_points; centroide++) {
        //
        //     var random_cent = durchschnitte_array[durchschnitte_array.length * Math.random() | 0];
        //     centro.push(random_cent);
        //
        // };

        // Funktion um den zu x am naechsten gelegenen Wert aus einem Array zu bestimmen
        var findClosest = function (x, arr) {

            var indexArr = arr.map(function (k) {
                return Math.abs(k - x)
            })
            var min = Math.min.apply(Math, indexArr)
            return arr[indexArr.indexOf(min)]
        };

        // Funktion die zwei Arrays miteinander vergleicht (true, wenn identisch)
        Array.prototype.equals = function (getArray) {
            if (this.length !== getArray.length) return false;

            for (var i = 0; i < getArray.length; i++) {
                if (this[i] instanceof Array && getArray[i] instanceof Array) {
                    if (!this[i].equals(getArray[i])) return false;
                } else if (this[i] !== getArray[i]) {
                    return false;
                }
            }
            return true;
        };

        var old_centro = centro;																	// fuer 1. Durchlauf der While-Schleife benoetigt um die 1. zufaellig generierten Centroide zu uebernehmen
        var check_end = false;																		// Variable als Schleifenbedingung (wenn true (Centroid gleichen sich), dann Schleife abbrechen)

        // BEGIN while schleife
        while (check_end === false) {

            // jeden Durchschnittstemperatur zum naechstgelegensten Centroid zuordnen
            var cluster = [];																		// 2-dimensionales Array zur Zwischenablage der neuen Clusterwerte
            for (centroide = 1; centroide <= cluster_points; centroide++) {
                cluster.push([]);
            };

            for (day = 0; day < tage_des_jahres; day++) {

                var min_dist = findClosest(durchschnitte_array[day], old_centro);
                var index_cent = old_centro.indexOf(min_dist);										// ermittelt Index des uebergebenen Werts aus Array

                cluster[index_cent].push(durchschnitte_array[day]);									// fuegt den Temperaturwert in dem Index ein, zu dessen Centroid der Wert am naechsten ist
            };

            var new_centro = [];
            // neue Centroide ermitteln, indem Durchschnitt der zuvor zugeordneten Durchschnittstemperaturen errechnet wird
            for (centroide = 0; centroide < cluster_points; centroide++) {

                var durchschnitt = 0;

                if (cluster[centroide].length != 0) {
                    for (laenge = 0; laenge < cluster[centroide].length; laenge++) {

                        durchschnitt = durchschnitt + cluster[centroide][laenge];					// ermittelt Durchschnitt der Werte eines Index -> wird anschliessend zum neuen Centroid
                    };

                    durchschnitt = durchschnitt / cluster[centroide].length;
                    durchschnitt = Math.round(durchschnitt * 10) / 10;								//runden der Temperaturen auf eine Nachkommastelle
                    new_centro.push(durchschnitt);
                } else {

                    new_centro.push(old_centro[centroide]);											// falls zuvor einem Centroid kein Wert zugeordnet wurde, den alten Centroid weiterverwenden
                };
            };

            var check_end = old_centro.equals(new_centro);											// ueberprueft die Abbruchbedingung der Schleife (falls die Centroide sich nicht mehr aendern)
            var old_cluster = cluster																// speichert fuer einen Schleifendurchlauf die alten zugeordneten Temperaturen
            var old_centro = new_centro																// speichert fuer einen Schleifendurchlauf die alten Centroide

        };
        // END while schleife

        // Funktion um Index eines Wertes in einem 2d-Array zu ermitteln (Rueckgabewert = Index (falls vorhanden), false (falls nicht vorhanden))
        function isItemInArray(array, item) {
            for (var i = 0; i < array.length; i++) {												// Zeilenweise Suchen

                for (var j = 0; j < array[i].length; j++) {											// Spaltenweise Suchen
                    if (array[i][j] === item) {
                        return i;   																// bei Erfolg entsprechende Zeile zurueckgeben
                    }
                }
            };
            return -1; 																				// falls Nichtvorhanden, dann '-1' als Rueckgabe, da Index nicht -1 sein kann
        };

        for (day = 0; day < tage_des_jahres; day++) {													// fuellt das tage_array tageweise mit dem zugeordneten Centroid-Index auf

            var temperatur = tage_array[day].avg_temp;
            var index_temp = isItemInArray(cluster, temperatur);
            // if (index_temp === -1) // dann FEHLER --> evtl in Function (isItemInArray) statt false als Index -1 ausgeben und im Kalender dann schwarz "fehlerhaft" ausgeben

            tage_array[day].index = index_temp;
        };

        var hour_array = [];																		// Array fuer Tageweise stuendliche Eintraege

        // fuer alle 365/366 Tage die stuendlichen Temperaturen in Array-Objekt speichern ( [{date, hour, temp}])
        for (day = 0; day < tage_des_jahres; day++) {

            // fuer den Tag 'day' alle 24 Stunden die Daten holen
            for (hour = 0; hour < 24; hour++) {

                var row = day * 24 + hour;
                var row_day = day * 24;
                const dateString = (data[row_day].datetime / 100).toString()						// Datum als String speichern (ohne Stunden)

                hour_array.push({'date': dateString, 'hour': hour, 'temp': data[row].temp});
                // hour_array.push({ 'date': data[row_day].datetime / 100, 'hour': hour, 'temp': data[row].temp });			//Tag als int
            };
        };

        var index_avg_temp_array = [];																// Array, in welchem fuer jedes Cluster ein Objekt aus den zugehoerigen stuendlichen Durchschnittstemperaturen gespeichert ist (fuer Diagramm wichtig)
        for (id = 0; id < cluster_points; id++) {														// id = Index des Clusters

            index_avg_temp_array.push([]);															// erzeugt das 2d Array
            var t_array = [];																		// Array erzeugt/leer gesetzt
            var anzahl = 0;
            var check = 0;

            // nehme id und pruefe der Reihe nach tage_array durch, ob tage_array[].index === id, falls ja, dann gehe in hour_array des jeweiligen Tages und schreibe die Temperaturen der Stunden in neues temporaeres Array t_array
            for (day = 0; day < tage_des_jahres; day++) {												// 365/366 Durchlaeufe, da tage_array 1 Eintrag fuer jeden Tag hat

                if (tage_array[day].index === id) {													// Tageweise vergleichen, ob der Index der richtige ist
                    for (hour = 0; hour < 24; hour++) {													// falls ja, dann in hour_array alle stuendl. Temperaturen speichern

                        var row = day * 24 + hour;
                        var t_temp = hour_array[row].temp;											// Temperatur der jeweiligen Stunde
                        t_array.push(t_temp);
                    };
                    check = 1;																		// wenn der Index mind. einmal vorkommt
                    anzahl = anzahl + 1;
                }
            };
            if (check === 1) {																		// Pruefung, ob im vorherigen Teil mindestens einmal der Index gefunden und somit t_array gefuellt ist
                for (hour = 0; hour < 24; hour++) {

                    var schnitt = 0;
                    for (zaehler = 0; zaehler < t_array.length; zaehler += 24) {

                        var row = hour + zaehler;													// Spruenge in 24er Schritten, beginnend mit dem Eintrag des Index 0
                        schnitt = schnitt + t_array[row];											// jeweilige Stunde aufsummieren
                    };
                    var durchschnitt_stunde = Math.round(schnitt / anzahl * 100) / 100;				// Durchschnitt der jeweiligen Stunde berechnen
                    index_avg_temp_array[id].push(durchschnitt_stunde);								// unter dem jeweils aktuellen Index des Clusters werden die Durchschnittstemperaturen der jeweiligen Stunde hintereinander gepusht
                };
            }
        };

        var d3ClusterTemp = [];																		// Array fuer d3 {cluster: ,hour: , temp: }, spaeter ueber d3.group

        for (i = 0; i < cluster_points; i++) {
            for (hour = 0; hour < 24; hour++) {
                d3ClusterTemp.push({'cluster': i, 'hour': hour, 'temp': index_avg_temp_array[i][hour]});
            };
        };

// auf tage_array[] letztendlich arbeiten (speichert Durchschnittstemperatur, genauen Tag (Datum + Wochentag), Index des zugehoerigen Centroids)
// tage_array zum Faerben der Tage im Kalender nutzen (Gleiches Cluster = Gleiche Farbe .. selbe Farbe wie Graph)
// index_avg_temp_array[x] hat fuer jeden Centroid x eine Liste der stuendlichen Durchschnittstemperaturen  (fuer den Graphen wichtig! die x Graphen werden durch diese Werte erzeugt!)
// evtl noch beim Festlegen der Centroide mit math.random mit if Schleife (centro[0]!=centro[1]!=centro[2]...) vergleichen, ob alle Werte im Array centro unterschiedlich, anderenfalls erneut generieren lassen

// Visualisierung (multiline Diagramm, Kalender automatisch generieren, Kalender Index zuordnen, ...)
        // Diagramm in d3 (v4 oder v6) y-Achse Temperaturen von ... bis ... (automatisch niedrigste/hoechste Temperatur ermitteln und noch -5/+5 draufrechnen); x-Achse Stunden 0-23
        // ueberdenken, ob Cluster richtig angegangen wurde (normalerweise Tagesmuster erarbeiten und diese dann einem bestimmten Tag zuordnen) --> evtl. nochmal neu clustern
        // LoeSUNGSANSATZ ... fuer jedes Cluster: von jedem Tag im Cluster die einzelnen Stunden aufsummieren und Durchschnitt ermitteln fuer die jeweilige Stunde.
        // Diese dann als Basis fuer den Graphen des Clusters im Diagramm nehmen.
        // also: if tage_array.index === 0/1/2/3/4/5/6/... (for schleife mit 0 init und bis maximal var cluster_points -1 durchlaufen lassen) then go in
        // ODER neue Struktur erstellen, wo alle TAGE vermerkt werden, in denen der Index gleich ist, daraufhin dann die einzelnen Tage betrachten
        // !!! Brauchen noch neues Array welches jeden Tag stuendlich einfach nur die Temperatur speichert (Tag: ... ; Stunde: ... ; Temperatur: ...) !!!
        // wollen im Endeffekt ein Array aus Objekten, welches abhaengig von der Anzahl der cluster_points fuer jede Stunde die Durchschnittstemperatur des cluster_points speichert
        // [{'day': , 'hour': , 'temp':}]
// als Topping dann evtl Highlighting oder Moeglichkeit, eigene .csv hochzuladen (mit vorgegebener Struktur)
// #CHECK#in den For-Schleifen die '365' noch durch eine Variable ersetzen, die zuvor anhand der Rohdaten 'datetime' ermittelt, ob das Jahr ein Schaltjahr ist (dann 366) oder normal (365)
// evtl automatisch eine Legende anlegen lassen, die als Beschriftung das Temperaturinterval des jeweiligen Clusters hat (+ schwarze Farbe fuer fehlerhafte Daten/Tage)
// new Date(2018,00,01).getDay()
// new Date("20180101".substr(0,4), "20180101".substr(4,2)-1, "20180101".substr(6,2))   --> Mon Jan 01 2018 00:00:00 GMT+0100 (Mitteleuropaeische Normalzeit)


//Testausgaben Console
//     	console.log(cent);
//     	console.log(durchschnitte_array);
//     	console.log(centro);
//     	console.log(cluster);
//     	console.log(new_centro);
//     	console.log(data);
//     	console.log(hour_array);
//     	console.log(tage_des_jahres);
        console.log(tage_array);
        console.log(index_avg_temp_array);
        console.log(d3ClusterTemp);
        console.log(avgMin);
        console.log(avgMax);
        console.log(avgDistance);
        console.log(stepValue);

// Beginn Diagramm
            let yLabel = "Temperatur";                                                                  // Beschriftung y-Achse
            let xLabel = "Uhrzeit";                                                                     // Beschriftung x-Achse
            // Dimension und margin vom Diagramm
            const margin = {top: 30, right: 30, bottom: 30, left: 50},
                width = 750 - margin.left - margin.right,
                height = 450 - margin.top - margin.bottom;

            // svg Objekt an html Body
            const svg = d3.select("#diagramm")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);


            const sumstatAxis = d3.group(hour_array, d => d.temp);

            // x-Achse
            const x = d3.scaleLinear()
                .domain([0, 23])
                .range([0, width]);
            svg.append("g")
                // .attr("transform", `translate(0, ${height})`)
                .attr("transform", `translate(0, 291.8)`)                                                    // benutzerdefinierte Position der x-Achse
                .call(d3.axisBottom(x).ticks(24));
            svg.append("text")
                .attr('fill', 'black')
                .text(xLabel)
                .attr('x', 620)
                .attr('y', 350);


            // y-Achse
            const y = d3.scaleLinear()
                .domain([d3.min(hour_array, d => d.temp), d3.max(hour_array, d => d.temp)])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y).ticks(25));
            svg.append("text")
                .attr('fill', 'black')
                .text(yLabel)
                .attr('transform', 'rotate(-90)')
                .attr('x', -90)
                .attr('y', -28);

            var sumstat = d3.group(d3ClusterTemp, d => d.cluster);                                          // gruppiert die Cluster nach dem Cluster-Index
            // Farben der Graphen (max. 9)
            const colorArray = ['#377eb8', '#7ac5cd', '#4daf4a', '#f8f32b', '#ff7f00', '#e41a1c', '#f781bf', '#984ea3', '#a65628', '#999999', '#000000'];
            const color = d3.scaleOrdinal()
                .range(colorArray)

            // Graphen zeichen
            svg.selectAll(".line")
                .data(sumstat)
                .join("path")
                .attr("fill", "none")
                .attr("stroke", d => color(d[0]))
                .attr("stroke-width", 1.5)
                .attr("d", d => {
                    return d3.line()
                        .x(d => x(d.hour))
                        .y(d => y(d.temp))
                        (d[1])
                });

            // Mouseover Ablesehilfe
            var compare_current_temp = [];
            function mouseOverHelper() {
                const mouse_g = svg.append('g').classed('mouse', true).style('display', 'none');
                mouse_g.append('rect').attr('width', 2).attr('x', -1).attr('height', height).attr('fill', 'lightgray');
                mouse_g.append('circle').attr('r', 3).attr("stroke", "steelblue");
                mouse_g.append('text');

                svg.on("mouseover", function (mouse) {
                    mouse_g.style('display', 'block');
                });
                const min_hour = 0;
                const max_hour = 23;
                const [min_temp, max_temp] = d3.extent(hour_array, d => d.temp);
                svg.on("mousemove", function (mouse) {
                    const [x_cord, y_cord] = d3.pointer(mouse);
                    const ratio_hour = x_cord / width;
                    const ratio_temp = y_cord / height;
                    let current_hour = min_hour + Math.round(ratio_hour * (max_hour - min_hour));
                    if (current_hour < 0) {
                        current_hour = 0;
                    }
                    const current_temp = Math.round((max_temp + (ratio_temp * (min_temp - max_temp))) * 100) / 100;

                    for(let clusterToLookAt = 0; clusterToLookAt < cluster_points; clusterToLookAt++) {        //soll bei der current_hour jedes Cluster in dieser Stunde durchgucken, den Temp-Wert nehmen und schauen, welcher dieser Werte am dichtesten zu der current_temp ist. Der Dichteste wird dann der Wert, der im Endeffekt angezeigt wird
                        for(let hourToLookAt = 0; hourToLookAt < 24; hourToLookAt++){
                            if(current_hour === hourToLookAt) {
                                let row = clusterToLookAt * 24 + hourToLookAt;
                                let tempToLookAt = d3ClusterTemp[row].temp;
                                compare_current_temp.push(tempToLookAt);
                            }
                        }

                    }
                    const shown_temp = findClosest(current_temp, compare_current_temp);
                    compare_current_temp.length = 0;

                    mouse_g.attr('transform', `translate(${x(current_hour)},${0})`);
                    mouse_g.select('text').text(`${current_hour} Uhr: ${shown_temp} °C`)
                        .attr('text-anchor', current_hour < (min_hour + max_hour) / 2 ? "start" : "end");
                    mouse_g.select('circle').attr('cy', y(shown_temp));
                    });
                    svg.on("mouseout", function (mouse) {
                        mouse_g.style('display', 'none');
                    });
                };
                mouseOverHelper();

//Ende Diagramm
//Beginn Kalender

        let yearName = document.querySelector('.year');
        const yearDiv = document.querySelector('#year');

        let dt = tage_array[0].date;
        let month = dt.getMonth() + 1                                                                   //Rueckgabe ist ein Wert zwischen 0-11, wir brauchen jedoch 1-12
        let year = dt.getFullYear();
        let currentDay = dt.getDate();

        let monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

        const calendar = () => {
            yearName.innerHTML = year;

            // Block zum dynamischen Erzeugen der html-Kalenderstruktur
            let counter = 0;
            for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
                const monthDiv = document.createElement('div');
                const monthName = document.createElement('span');
                monthName.innerHTML = monthNames[monthIndex - 1];
                monthDiv.appendChild(monthName);
                const monthUl = document.createElement('ul');
                const daysUl = document.createElement('ul');
                const mon = document.createElement('li');
                mon.innerHTML = 'Mo';
                monthUl.appendChild(mon);
                const die = document.createElement('li');
                die.innerHTML = 'Di';
                monthUl.appendChild(die);
                const mit = document.createElement('li');
                mit.innerHTML = 'Mi';
                monthUl.appendChild(mit);
                const don = document.createElement('li');
                don.innerHTML = 'Do';
                monthUl.appendChild(don);
                const fre = document.createElement('li');
                fre.innerHTML = 'Fr';
                monthUl.appendChild(fre);
                const sam = document.createElement('li');
                sam.innerHTML = 'Sa';
                monthUl.appendChild(sam);
                const son = document.createElement('li');
                son.innerHTML = 'So';
                monthUl.appendChild(son);
                monthDiv.setAttribute('id', `month${monthIndex}`);
                monthDiv.setAttribute('class', `monthStyling`);
                monthUl.setAttribute('class', 'weekdays');
                daysUl.setAttribute('class', 'days');
                monthDiv.appendChild(monthUl);
                monthDiv.appendChild(daysUl);
                yearDiv.appendChild(monthDiv);

                counter = buildMonth(year, monthIndex, counter);
            }
        }

        const buildMonth = (year, month, counter) => {
            const dayList = document.querySelector(`#month${month} .days`);
            const dayNumber = new Date(year, month - 1, 1).getDay();
            const daysInMonth = new Date(year, month, 0).getDate(); //Anzahl der Tage eines Monats ermitteln
            let gaps;

            if (dayNumber === 0) {
                gaps = 6
            } else {
                gaps = dayNumber - 1;
                // Montag waere dayNumber = 1, also gaps = 1-1 = 0;
                // Donnerstag waere dayNumber = 4, also gaps = 4-1 = 3;
            }

            for (let day = -gaps + 1; day <= daysInMonth; day++) {
                const days = document.createElement('li');

                if (day <= 0) {	// wenn der index vom Tag kleiner als 0 ist, dann wird dieser als "gap" im Kalender eingetragen.
                    days.innerHTML = "";
                    dayList.appendChild(days);
                } else {
                    let clusterIndex = colorArray.length - 1;

                    try {
                        clusterIndex = tage_array[counter].index;
                    } catch (e) {
                        console.log('ERROR: fehlender Index - ', counter)
                    }

                    const dayColor = colorArray[clusterIndex];
                    days.setAttribute('class', 'clusterBase');
                    days.setAttribute('style', `background-color: ${dayColor}`);            // setzt im Kalender beim jeweiligen Tag die Farbe des zugehoerigen Graphen/Clusters
                    days.innerHTML = day;
                    dayList.appendChild(days);
                    counter++;
                }
            }

            return counter;
        }
        calendar();                                                                                            // Aufruf des Kalenders
// Ende Kalender

    });
