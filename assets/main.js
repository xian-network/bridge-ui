var address = null;
var solanaAddress = null;

function capitalize(str) {
    if (!str) return str;
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }
  

// Handle pasted input to ensure it follows the format
function handlePaste(event) {
    event.preventDefault(); // Prevent default paste behavior

    let pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    // Clean the pasted text
    pastedText = pastedText.replace(/[^0-9.]/g, ''); // Remove invalid characters
    
    let parts = pastedText.split('.');
    if (parts.length > 2) {
        pastedText = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts[1] && parts[1].length > 8) {
        pastedText = parts[0] + '.' + parts[1].substring(0, 8);
    }
    
    event.target.value = pastedText;
}
function validateAmount(input) {
    let inputGroup = input.closest('.input-group'); // Get the surrounding div
    let errorMessage = inputGroup.querySelector('.error-message');

    // Remove non-numeric characters except "."
    input.value = input.value.replace(/[^0-9.]/g, '');

    // Ensure only one "." is present
    let parts = input.value.split('.');
    if (parts.length > 2) {
        input.value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 8 decimal places
    if (parts[1] && parts[1].length > 8) {
        input.value = parts[0] + '.' + parts[1].substring(0, 8);
    }

    // Validate: must not be empty and must be greater than 0
    if (!input.value || parseFloat(input.value) <= 0) {
        inputGroup.classList.add('error');
        errorMessage.style.display = 'block';
        errorMessage.innerText = 'Enter a valid amount greater than 0';
    } else {
        inputGroup.classList.remove('error');
        errorMessage.style.display = 'none';
    }
}

function validateBridgeSelection() {
    let fromSelect = document.getElementById("from");
    let toSelect = document.getElementById("to");

    // Prevent selecting the same chain
    if (fromSelect.value === toSelect.value) {
        toSelect.value = fromSelect.value === "xian" ? "solana" : "xian"; // Auto-fix
    }

    // Update available options
    updateToOptions();
}

function updateToOptions() {
    let fromValue = document.getElementById("from").value;
    let toSelect = document.getElementById("to");

    // Enable all options first
    Array.from(toSelect.options).forEach(option => {
        option.disabled = false;
    });

    // Disable the selected "From" option in the "To" dropdown
    Array.from(toSelect.options).forEach(option => {
        if (option.value === fromValue) {
            option.disabled = true;
        }
    });
}


function updateChainLogos() {
    validateBridgeSelection();
    
    let fromSelect = document.getElementById("from");
    let toSelect = document.getElementById("to");

    let fromLogo = document.getElementById("from-logo");
    let toLogo = document.getElementById("to-logo");

    // Update logos based on selected option
    fromLogo.src = fromSelect.options[fromSelect.selectedIndex].getAttribute("data-logo");
    toLogo.src = toSelect.options[toSelect.selectedIndex].getAttribute("data-logo");

    
}

function updateAssetLogo() {
    let assetSelect = document.getElementById("asset");
    let assetLogo = document.getElementById("asset-logo");

    // Update asset logo based on selected option
    assetLogo.src = assetSelect.options[assetSelect.selectedIndex].getAttribute("data-logo");
}

function swapChains() {
    let fromSelect = document.getElementById("from");
    let toSelect = document.getElementById("to");

    // Swap values
    let temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;

    // Ensure they are not the same
    if (fromSelect.value === toSelect.value) {
        toSelect.value = fromSelect.value === "xian" ? "solana" : "xian"; // Auto-fix
    }

    // Update logos and validate selection
    updateChainLogos();
    validateBridgeSelection();
}



function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");

    // Create toast element
    const toast = document.createElement("div");
    toast.classList.add("toast", `toast-${type}`);

    // Add icon based on type
    const icon = type === "success" ? '<i class="bi bi-check-circle"></i>' : '<i class="bi bi-exclamation-triangle"></i>';
    toast.innerHTML = `${icon} ${message}`;

    // Append to container
    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function connectXianWallet() {
    // We show a loading spinner while the wallet is being connected
    XianWalletUtils.requestWalletInfo()
    .then(info => {
        if (info.locked) {
            showToast('Please unlock your wallet', 'error');
            return;
        }
        address = info.address;
        document.querySelector("#connect-wallet-xian").innerHTML = 'Connected as ' + address.slice(0, 6) + '...' + address.slice(-4);
        document.querySelector("#connect-wallet-xian").classList.add("disabled");

        if(address && solanaAddress) {
            document.querySelector("#bridge-btn").classList.remove("disabled");
            // Remove disabled
            document.querySelector("#bridge-btn").disabled = false;
        }
    })
    .catch(error => {
        showToast('Xian Wallet Chrome extension not installed or not responding', 'error');
    });
}
async function connectPhantomWallet() {
    console.log("Attempting to connect to Phantom Wallet...");

    try {
        if (!window.solana || !window.solana.isPhantom) {
            showToast("Phantom Wallet not installed!", "error");
            console.error("Phantom Wallet is not detected.");
            return;
        }

        // Request wallet connection
        const response = await window.solana.connect();
        console.log("Wallet connected:", response);

        // Get wallet address
        const solAddress = response.publicKey.toString();

        // Store in localStorage
        solanaAddress = solAddress;

        // Update the UI
        const connectBtn = document.getElementById("connect-wallet-solana");
        connectBtn.innerText = "Connected as " + solAddress.slice(0, 6) + "..." + solAddress.slice(-4);
        connectBtn.classList.add("disabled");

        if(address && solanaAddress) {
            document.querySelector("#bridge-btn").classList.remove("disabled");
            // Remove disabled
            document.querySelector("#bridge-btn").disabled = false;
        }
    } catch (error) {
        console.error("Phantom Wallet connection failed:", error);
        showToast("Failed to connect to Phantom Wallet", "error");
    }
}

function startBridge() {
    document.getElementById('bridge-btn').innerText = 'Sending..';
    document.getElementById('bridge-btn').innerText = 'Sweeping..';
    document.getElementById('bridge-btn').innerText = 'Transferring..';
    document.getElementById('bridge-btn').innerText = 'Done!';
    document.getElementById('bridge-btn').classList.add('disabled');
}


function nextStep(step) {
    if (step === 3) {
        let amountInput = document.getElementById('amount');
        let inputGroup = amountInput.closest('.input-group');
        let errorMessage = inputGroup.querySelector('.error-message');

        // Ensure amount is valid
        if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
            inputGroup.classList.add('error');
            errorMessage.style.display = 'block';
            errorMessage.innerText = 'Enter a valid amount greater than 0';
            return; // Stop user from proceeding
        } else {
            inputGroup.classList.remove('error');
            errorMessage.style.display = 'none';
        }

        // Fill confirmation details
        document.getElementById('amount-bridge').innerText = amountInput.value;
        document.getElementById('asset-bridge').innerText = document.getElementById('asset').value;
        document.getElementById('from-bridge').innerText = capitalize(document.getElementById('from').value);
        document.getElementById('to-bridge').innerText = capitalize(document.getElementById('to').value);

        
    }

    // Change step if validation passed
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-indicator div').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    document.getElementById(`indicator${step}`).classList.add('active');
    if(step === 2) {
        // Make the amount active so the user can enter the amount
        document.getElementById('amount').focus();
    }
}
function toggleNav() {
    document.querySelector('.vertical-text-nav').classList.toggle('open');
}

function navigateTo(section) {
    console.log("Navigating to:", section);

    // Remove active class from all items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Set active class on clicked item
    event.currentTarget.classList.add('active');

    // Close menu after selection on mobile
    document.querySelector('.vertical-text-nav').classList.remove('open');
}



// Run this on page load to ensure options are correct
document.addEventListener("DOMContentLoaded", function() {
    updateToOptions();
});
