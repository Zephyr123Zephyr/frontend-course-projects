fetch("senators.json").then(response => { // Fetch the JSON file and test if successfully fetched
    if (!response.ok) {
        document.getElementById("screen").className = "hidden";
        document.getElementById("error-message").innerHTML = "Error: Can't fetch the source JSON file.";
    }
    return response.json();
}).then(snO => { // Parse into JavaScript object
    const cOfParties = new Map(); // To store parties and their counts of senators
    const states = new Set(); // To store states
    const ranks = new Set(); // To store ranks
    const SHOW_ALL = "Show All...";

    // Comparison function for sorting senators, party first, name second, alphabetically
    snO.objects.sort(function (a, b) {
        if (a.party < b.party) {
            return -1;
        } else if (a.party > b.party) {
            return 1;
        } else if (a.person.firstname < b.person.firstname) {
            return -1;
        } else if (a.person.firstname > b.person.firstname) {
            return 1;
        } else return 0;
    })

    // First iteration for filling the sets and loading the leaders
    let index = 0;
    for (const perObj of snO.objects) {
        perObj.index = index++;
        perObj.name = perObj.person.firstname + " " + perObj.person.middlename + " " + perObj.person.lastname;
        if (!cOfParties.has(perObj.party)) {
            cOfParties.set(perObj.party, 1);
        } else cOfParties.set(perObj.party, cOfParties.get(perObj.party) + 1);
        states.add(perObj.state);
        ranks.add(perObj.senator_rank_label);
        if (perObj.leadership_title != null) {
            let li = document.createElement("li");
            li.innerHTML = perObj.leadership_title + ": " + perObj.name + " (" + perObj.party + ")";
            document.getElementById("leadersOfParties").appendChild(li);
        }
    }

    // Add "Show all" option to each selector
    for (const selectorId of ["party-selector", "state-selector", "rank-selector"]) {
        let optionElement = document.createElement("option");
        optionElement.innerHTML = SHOW_ALL;
        document.getElementById(selectorId).appendChild(optionElement);
    }

    // Load the parties and counts of senators' blocks & Fill the selectors with options
    for (const party of cOfParties.keys()) {
        let partyBlockEle = document.createElement("div");
        partyBlockEle.className = "party-block";
        let partyBlockParty = document.createElement("div");
        partyBlockParty.className = "party";
        partyBlockParty.innerHTML = party;
        let partyBlockData = document.createElement("div");
        partyBlockData.className = "data";
        partyBlockData.innerHTML = cOfParties.get(party);
        partyBlockEle.appendChild(partyBlockParty);
        partyBlockEle.appendChild(partyBlockData);
        document.getElementById("cOfParties").appendChild(partyBlockEle);

        let optionElement = document.createElement("option");
        optionElement.innerHTML = party;
        document.getElementById("party-selector").appendChild(optionElement);
    }
    for (const state of states) {
        let optionElement = document.createElement("option");
        optionElement.innerHTML = state;
        document.getElementById("state-selector").appendChild(optionElement);
    }
    for (const rank of ranks) {
        let optionElement = document.createElement("option");
        optionElement.innerHTML = rank;
        document.getElementById("rank-selector").appendChild(optionElement);
    }

    // EventListener: store and submit the filter selections for table reloading
    const selPros = {party: SHOW_ALL, state: SHOW_ALL, rank: SHOW_ALL};
    document.getElementById("filters").addEventListener("submit", function (event) {
        event.preventDefault();
        selPros.party = document.getElementById("party-selector").value;
        selPros.state = document.getElementById("state-selector").value;
        selPros.rank = document.getElementById("rank-selector").value;
        displayTable();
    });

    // Function of loading the table according to chosen selectors
    const TABLE_COL_PATHS = [".name", ".party", ".state", ".person.gender_label", ".senator_rank_label"];
    function displayTable() {
        document.getElementById("displayTable").innerHTML = "<tr><th>Name</th><th>Party</th><th>State</th><th>Gender</th><th>Rank</th></tr>";

        for (const perObj of snO.objects.filter(function (perObj) {
            return (selPros.party === SHOW_ALL || selPros.party === perObj.party)
                && (selPros.state === SHOW_ALL || selPros.state === perObj.state)
                && (selPros.rank === SHOW_ALL || selPros.rank === perObj.senator_rank_label);
        })) {
            let perRow = document.createElement("tr");
            perRow.className = "hoverable";
            perRow.index = perObj.index;
            for (let path of TABLE_COL_PATHS) {
                let perData = document.createElement("td");
                perData.innerHTML = eval("perObj" + path);
                perRow.appendChild(perData);
            }
            document.getElementById("displayTable").appendChild(perRow);
        }
    }

    // Load the table for the first time
    displayTable();

    // Implement dropdown details of each senator row
    let newRow = null; // Point to new-generated dropdown row of details
    let selectedRow = null; // Point to the selected senator row
    document.getElementById("displayTable").addEventListener("click", function (event) {
        // make sure the clicked target is a senator row
        let target = event.target;
        while (target.tagName !== "TR" && target !== this) {
            target = target.parentElement;
        }
        if (target === newRow || target.tagName !== "TR") return;

        // if already opened a dropdown and clicked the senator again, close it
        if (newRow != null) {
            newRow.remove(); // close it
            newRow = null;
            selectedRow.className = "hoverable";
        }
        if (selectedRow && target === selectedRow) {
            selectedRow = null;
            return;
        }

        // create and fill the dropdown row with detailed data
        selectedRow = target;
        newRow = document.createElement("tr");
        const newCell = document.createElement("td");
        newCell.colSpan = TABLE_COL_PATHS.length;
        newCell.className = "detailed-td";
        selectedRow.className = "detailed-hoverable";
        const perObj = snO.objects[target.index];
        const DETAILS = {
            "Office": ".extra.office",
            "Date of birth": ".person.birthday",
            "Start date": ".startdate",
            "Twitter": ".person.twitterid",
            "YouTube": ".person.youtubeid"
        }
        for (let dtl in DETAILS) {
            if (eval("perObj" + DETAILS[dtl])) {
                let term = document.createElement("b")
                term.innerHTML = dtl + ": ";
                newCell.appendChild(term);
                newCell.innerHTML += eval("perObj" + DETAILS[dtl]) + "<br>";
            }
        }
        newCell.innerHTML = newCell.innerHTML.slice(0, -1);
        if (perObj.website) {
            let term = document.createElement("b");
            term.innerHTML = "<br>Website: ";
            let a = document.createElement("a");
            a.innerHTML = perObj.website;
            a.href = perObj.website;
            a.target = "_blank";
            newCell.appendChild(term).appendChild(a);
        }
        newRow.appendChild(newCell);
        target.insertAdjacentElement("afterend", newRow);
    })
})
