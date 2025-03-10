var xianAddress = null;
var solanaAddress = null;
var route = null;
var amount = null;
var asset = null;

var token_contracts = {
    "USDC": {"xian": "currency", "solana": {"token_address":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","decimals":6}},
};

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
        xianAddress = info.address;
        document.querySelector("#connect-wallet-xian").innerHTML = 'Connected as ' + xianAddress.slice(0, 6) + '...' + xianAddress.slice(-4);
        document.querySelector("#connect-wallet-xian").classList.add("disabled");

        if(xianAddress && solanaAddress) {
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
        if (!window.solana) {
            showToast("No Solana wallet detected", "error");
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

        if(xianAddress && solanaAddress) {
            document.querySelector("#bridge-btn").classList.remove("disabled");
            // Remove disabled
            document.querySelector("#bridge-btn").disabled = false;
        }
    } catch (error) {
        console.error("Phantom Wallet connection failed:", error);
        showToast("Failed to connect to Phantom Wallet", "error");
    }
}

function createSPLTokenTransferInstruction(
    sourcePubkey,
    destinationPubkey,
    ownerPubkey,
    amount // BigInt or number
  ) {
    // 1 byte for the instruction (3 = Transfer), plus 8 bytes for the amount in little-endian
    const data = new Uint8Array(1 + 8);
  
    // Instruction code "3" = Transfer in the SPL Token Program
    data[0] = 3;
  
    // Convert "amount" to BigInt if it's not already
    const amountBI = typeof amount === 'bigint' ? amount : BigInt(amount);
  
    // Write the amount in little-endian using DataView
    const dataView = new DataView(data.buffer);
    dataView.setBigUint64(1, amountBI, true); // littleEndian = true
  
    return new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: sourcePubkey,      isSigner: false, isWritable: true },
        { pubkey: destinationPubkey, isSigner: false, isWritable: true },
        { pubkey: ownerPubkey,       isSigner: true,  isWritable: false },
      ],
      programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token Program
      data, // data is your Uint8Array
    });
  }

async function findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
    // OPTIONAL sanity check (proper syntax):
    if (typeof walletAddress !== "object" || typeof tokenMintAddress !== "object") {
      console.warn("walletAddress or tokenMintAddress is not an object");
      return null; // or throw an error
    }
  
    // Now find the ATA
    const [pda] = await solanaWeb3.PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(), // SPL Token Program ID
        tokenMintAddress.toBuffer(),
      ],
      new solanaWeb3.PublicKey("ATokenGPnLK5ZmQxczpxzEJt9WZ9odWWwRysqi6v5tXN") // ATA Program ID
    );
    return pda;
  }

  async function fetchLatestBlockhash(rpcUrl, commitment = "finalized") {
    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "getLatestBlockhash",
      params: [
        {
          commitment
        }
      ]
    };
  
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
  
    const json = await response.json();
    if (json.error) {
      throw new Error("Failed to fetch blockhash: " + json.error.message);
    }
  
    // json.result.value => { blockhash: string, lastValidBlockHeight: number }
    return json.result.value;
  }

  function resetBridgeButton() {
    // Convenience function to reset the Bridge button if something fails
    const bridgeBtn = document.getElementById("restart");
    bridgeBtn.classList.remove("disabled");
    bridgeBtn.disabled = false;
}
  

async function startBridge() {
    const bridgeBtn = document.getElementById("bridge-btn");
    bridgeBtn.classList.add("disabled");
    bridgeBtn.innerText = "Processing...";

    if (route === 'solana_to_xian') {
        // The user is bridging from Solana to Xian
        updateBridgeStatus("status-sending"); // Show UI step "Sending"

        // 1) Get the deposit address from your API
        let tokenDetails = token_contracts[asset]["solana"];
        let tokenMintAddress = tokenDetails["token_address"];
        let decimals = tokenDetails["decimals"];

        let depositAddress = await solanaToXianRequest(tokenMintAddress, amount, xianAddress);
        if (!depositAddress) {
            showToast("Failed to get deposit address. Please try again later.", "error");
            resetBridgeButton();
            return;
        }

        // 2) Prompt the user’s Phantom wallet to sign a transaction
        try {
            const provider = window.solana;
            if (!provider) {
                showToast("No Solana wallet detected", "error");
                resetBridgeButton();
                return;
            }

            const connection = new solanaWeb3.Connection("https://solana.drpc.org");

            const sender = new solanaWeb3.PublicKey(solanaAddress);
            const receiver = new solanaWeb3.PublicKey(depositAddress);
            const tokenMint = new solanaWeb3.PublicKey(tokenMintAddress);

            const senderTokenAccount = await findAssociatedTokenAddress(sender, tokenMint);
            const receiverTokenAccount = await findAssociatedTokenAddress(receiver, tokenMint);

            let scaledAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
            const transaction = new solanaWeb3.Transaction().add(
                createSPLTokenTransferInstruction(
                    senderTokenAccount,
                    receiverTokenAccount,
                    sender,
                    scaledAmount
                )
            );
            transaction.feePayer = sender;
            const { blockhash } = await fetchLatestBlockhash("https://solana.drpc.org");
            transaction.recentBlockhash = blockhash;

            showToast("Please approve the transaction in your Phantom Wallet.", "info");
            const signedTransaction = await provider.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            await connection.confirmTransaction(signature, "confirmed");
        } catch (error) {
            showToast("Failed to send transaction. Please try again.", "error");
            resetBridgeButton();
            return;
        }

        // 3) Now that the Solana transaction was successful, start monitoring
        monitoringStatusLoopSolana(depositAddress, (status) => {
            // status can be: created, deposited, sweeped, completed, expired
            switch (status) {
                case "created":
                    // The deposit address was registered on the server but has no on-chain deposit yet
                    updateBridgeStatus("status-sending");
                    break;
                case "deposited":
                    // The deposit is now on-chain; server sees it
                    updateBridgeStatus("status-sweeping");
                    break;
                case "sweeped":
                    // The deposit was swept internally
                    updateBridgeStatus("status-transferring");
                    break;
                case "completed":
                    // The bridging is done
                    updateBridgeStatus("status-done");
                    showToast("Bridge completed successfully!", "success");
                    //document.getElementById("tx-url").style.display = "block";
                    document.getElementById("restart").classList.remove("disabled");
                    document.getElementById("restart").disabled = false;
                    break;
                case "expired":
                    showToast("The bridge request expired. Please try again.", "error");
                    document.getElementById("restart").classList.remove("disabled");
                    document.getElementById("restart").disabled = false;
                    break;
                default:
                    console.warn("Unknown status:", status);
                    break;
            }
        });


    }
    else if (route === 'xian_to_solana') {  
        // The user is bridging from Xian to Solana
        updateBridgeStatus("status-sending");

        // 1) Ask the server for a deposit address on Xian side
        let token_contract = token_contracts[asset]["xian"];
        let depositAddress = await xianToSolanaRequest(token_contract, amount, solanaAddress);
        if (!depositAddress) {
            showToast("Failed to get deposit address. Please try again later.", "error");
            resetBridgeButton();
            return;
        }

        // 2) Prompt Xian Wallet to send the tokens
        try {
            let tx = await XianWalletUtils.sendTransaction(
                token_contract,
                "transfer",
                {
                    "to": depositAddress,
                    "amount": parseFloat(amount)
                },
            );
            if (tx.errors) {
                showToast("Transaction failed. Please try again.", "error");
                resetBridgeButton();
                return;
            }
        } catch (error) {
            showToast("Failed to send Xian transaction. Please try again.", "error");
            resetBridgeButton();
            return;
        }

         // 3) Start monitoring that deposit address on your server
         monitoringStatusLoopXian(depositAddress, (status) => {
            switch (status) {
                case "created":
                    updateBridgeStatus("status-sending");
                    break;
                case "deposited":
                    updateBridgeStatus("status-sweeping");
                    break;
                case "sweeped":
                    updateBridgeStatus("status-transferring");
                    break;
                case "completed":
                    updateBridgeStatus("status-done");
                    showToast("Bridge completed successfully!", "success");
                    //document.getElementById("tx-url").style.display = "block";
                    document.getElementById("restart").classList.remove("disabled");
                    document.getElementById("restart").disabled = false;
                    break;
                case "expired":
                    showToast("The bridge request expired. Please try again.", "error");
                    document.getElementById("restart").classList.remove("disabled");
                    document.getElementById("restart").disabled = false;
                    break;
                default:
                    console.warn("Unknown status:", status);
                    break;
            }
        });
    }
}

function updateBridgeStatus(stepId) {
    document.querySelectorAll(".status-item").forEach(step => step.classList.remove("active"));
    document.getElementById(stepId).classList.add("active");
}

function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Close the announcement bar
function closeAnnouncement() {
    document.getElementById("announcement").style.display = "none";
    document.body.style.paddingTop = "0"; // Reset padding when closed
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

        amount = amountInput.value;
        asset = document.getElementById('asset').value;
        route = document.getElementById('from').value === 'solana' ? 'solana_to_xian' : 'xian_to_solana';
        
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
     // If moving to Step 4, start bridge process
     if (step === 4) {
        document.getElementById('tx-url').style.display = 'none';
        startBridge();
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
