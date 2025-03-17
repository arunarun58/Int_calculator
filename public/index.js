function calculate() {
    const accounts = document.querySelectorAll(".account-entry");
    let results = [];
    let totalInterestAfterTax = 0;
    let totalPrincipal = 0;  // Variable to hold the total principal amount
    let totalMonths = 0;
    let quarterMonths = 4;
    let taxRate = parseFloat(document.getElementById("tax").value) || 0;

    accounts.forEach(account => {
        let name = account.querySelector("input[name='account']").value;
        let principal = parseFloat(account.querySelector("input[name='principal']").value) || 0;
        let rate = parseFloat(account.querySelector("input[name='rate']").value) || 0;
        let time = parseFloat(account.querySelector("input[name='time']").value) || 0;
        let date = account.querySelector("input[name='date']").value || "N/A";

        if (!name || principal <= 0 || rate <= 0 || time <= 0) {
            alert("Please enter valid values for all fields.");
            return;
        }

        let si = (principal * rate * time) / 100;
        let siAT = si - ((taxRate / 100) * si);
        totalInterestAfterTax += siAT;
        totalMonths += time * 12;
        totalPrincipal += principal; // Add to the total principal

        let siQT = siAT / quarterMonths;
        let siMO = siAT / 12;
        results.push({ name, date, principal, rate, time, siAT: siAT.toFixed(2), siQT: siQT.toFixed(2), siMO: siMO.toFixed(2) });
    });

    // Display results in the table
    const resultsTable = document.querySelector("#results-table tbody");
    resultsTable.innerHTML = ""; // Clear previous results

    results.forEach(result => {
        let row = `<tr>
            <td>${result.name}</td>
            <td>${result.date}</td>
            <td>${result.principal.toFixed(2)}</td>
            <td>${result.rate.toFixed(2)}</td>
            <td>${result.time}</td>
            <td>${result.siAT}</td>
            <td>${result.siQT}</td>
            <td>${result.siMO}</td>
        </tr>`;
        resultsTable.insertAdjacentHTML("beforeend", row);
    });

    // Update total interest and monthly interest
    let monthlyInterest = totalInterestAfterTax / 12;
    let quarterlyInterest = totalInterestAfterTax / 4;
    let dailyInterest = totalInterestAfterTax / 365;

    document.getElementById("total-interest").innerText = totalInterestAfterTax.toFixed(2);
    document.getElementById("monthly-interest").innerText = monthlyInterest.toFixed(2);
    document.getElementById("quat-interest").innerText = quarterlyInterest.toFixed(2);
    document.getElementById("daily-interest").innerText = dailyInterest.toFixed(2);
    document.getElementById("total-assets").innerText = totalPrincipal.toFixed(2); // Update the total principal
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'block';
}

// Function to clear inputs
function clearInputs() {
    let results = [];
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'none';

    document.querySelectorAll("input").forEach(input => input.value = "");
    document.getElementById("total-interest").innerText = "";
    document.getElementById("quat-interest").innerText = "";
    document.getElementById("monthly-interest").innerText = "";
    document.getElementById("daily-interest").innerText = "";
    document.getElementById("total-assets").innerText = "";

    const resultsTable = document.querySelector("#results-table tbody");
    resultsTable.innerHTML = ""; // Clear previous results
}

// Function to add a new account input row
function addAccount() {
    const container = document.getElementById("accounts-container");
    const newEntry = document.createElement("div");
    newEntry.classList.add("account-entry");
    newEntry.innerHTML = `
        <input name="account" placeholder="Account Name">
        <input name="principal" type="number" placeholder="Deposit">
        <input name="rate" type="number" placeholder="Rate">
        <input name="time" type="number" placeholder="Time in years">
        <input name="date" type="text">
        <button type="button" onclick="removeAccount(this)">❌</button>
    `;

    container.appendChild(newEntry);
}

// Function to remove an account input row
function removeAccount(button) {
    button.parentElement.remove();
}

// Export to PDF function
function exportToPDF() {
    fetch('/bs-date')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const bsDate = data.bsDate; // Get the BS date from the response

            const todayDate = new Date();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Ensure autoTable is available
            if (typeof doc.autoTable !== "function") {
                alert("Error: autoTable plugin is not loaded properly.");
                return;
            }

            // Get the AD date and format it
            const options = { month: "short", day: "2-digit", year: "numeric" };
            const formattedDate = `As of ${todayDate.toLocaleDateString("en-US", options)}`;

            // Add to the PDF
            doc.setFontSize(16);
            doc.text(`Balance Sheet - Deposits ${formattedDate} (BS Date: ${bsDate})`, 14, 20);

            // Extract Table Data
            const tableHeaders = [['Account Name', 'Date of Deposit', 'Deposit', 'Rate (%)', 'Time (Years)', 'Yearly Interest', 'Quarterly Interest', 'Monthly Interest']];
            const tableRows = [];
            document.querySelectorAll("#results-table tbody tr").forEach(row => {
                const rowData = Array.from(row.cells).map(cell => cell.innerText);
                tableRows.push(rowData);
            });

            // Prevent exporting an empty table
            if (tableRows.length === 0) {
                alert("No data available to export.");
                return;
            }

            // Use autoTable to add the table
            doc.autoTable({
                head: tableHeaders,
                body: tableRows,
                startY: 40,  // Adjust startY to position the table correctly
                theme: 'grid',
                margin: { top: 20, left: 10, right: 10 },
            });

            // Add Total Principal below the table
            const totalPrincipal = document.getElementById("total-assets").innerText;
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.text(`Total Deposit: ${totalPrincipal}`, 14, finalY + 10);

            // Add Total Interest, Quarterly, Monthly and Daily Interests
            doc.text(`Total Yearly Interest: ${document.getElementById("total-interest").innerText}`, 14, finalY + 20);
            doc.text(`Quarterly Interest: ${document.getElementById("quat-interest").innerText}`, 14, finalY + 25);
            doc.text(`Monthly Interest: ${document.getElementById("monthly-interest").innerText}`, 14, finalY + 30);
            doc.text(`Daily Interest: ${document.getElementById("daily-interest").innerText}`, 14, finalY + 35);

            // Save the PDF
            doc.save("balance-sheet.pdf");
        })
        .catch(error => {
            console.error('Error fetching BS date:', error);
        });
}
