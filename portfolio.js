// ==UserScript==
// @name         Stake Portfolio CSV
// @namespace    https://stake.com.au/
// @version      0.1
// @description  Stake portfolio CSV export
// @author       Brodie
// @match        https://stake.com.au/dashboard/portfolio
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Build the CSV and trigger the download
    function makeCSV(positions) {
        // CSV header
        let header = ["Name", "Symbol", "Shares", "Market Value", "Performance ($)", "Performance (%)", "Average Price", "Last Price ($)", "Last Price (%)", "Day Result"];
        let rows = [header];

        // create each of the csv rows from the position data
        positions.map(s => rows.push([
            `"${s.name}"`,
            `"${s.symbol}"`,
            s.availableForTradingQty,
            s.marketValue,
            s.unrealizedPL,
            (((s.costBasis - s.unrealizedPL) / s.costBasis) * 100).toFixed(2),
            s.avgPrice,
            s.lastTrade,
            s.unrealizedDayPLPercent,
            s.unrealizedDayPL
        ]));

        let blob = new Blob([rows.map(r => r.join(",")).join("\r\n")], { type: 'text/csv;charset=utf-8;' });
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "portfolio.csv");
        link.style = "visibility:hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Request the Stake API to return the equity positions using the users session key
    function fetchPositions() {
        let request = new Request('https://prd-api.stake.com.au/api/users/accounts/equityPositions', {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow',
          referrer: 'https://stake.com.au/dashboard/portfolio',
          referrerPolicy: 'no-referrer-when-downgrade',
          headers: new Headers({
              Accept: 'application/json',
              'Content-type': 'application/json',
              'Stake-Session-Token': localStorage.sessionKey,
          })
      });
      return fetch(request).then((rsp) => rsp.json())
    }

    window.onload = function () {
        // wait for the document to create the portfolio table then insert a button above it
        let checkExist = setInterval(function() {
            let pos = document.getElementsByClassName("portfolio-details");
            if (pos.length) {
                clearInterval(checkExist);
                pos[0].insertAdjacentHTML('beforebegin', '<span id="export_portfolio_csv" style="cursor: pointer; background-color: #FFFFFF; padding-left:2px; padding-right: 2px;">Export Portfolio</span>');

                // create a on click callback on the new button - when clicked it will trigger the API call and the generation of the CSV
                document.getElementById('export_portfolio_csv').addEventListener('click', function() {
                    fetchPositions()
                        .then((rsp) => makeCSV(rsp.equityPositions))

                });
            }
        }, 100);
    }
})();