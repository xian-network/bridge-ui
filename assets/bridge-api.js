var apiUrl = 'http://localhost:8080';

// Solana to Xian /solana_to_xian POST {token_contract: string, token_amount: float, xian_address: string}
// Xian to Solana /xian_to_solana POST {token_contract: string, token_amount: float, solana_address: string}

async function solanaToXianRequest(tokenContract, tokenAmount, xianAddress) {
    try {
        const response = await fetch(apiUrl + '/solana_to_xian', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            token_contract: tokenContract,
            token_amount: tokenAmount,
            xian_address: xianAddress
            })
        });
        response_data = response.json();
        if (response_data.status == true) {
            return response_data.result; // Deposit address on Solana
        }
        return null;
    }
    catch (error) {
        showToast("Could not connect to the bridge server", "error");
        return null;
    }
}

async function xianToSolanaRequest(tokenContract, tokenAmount, solanaAddress) {
    try {
        const response = await fetch(apiUrl + '/xian_to_solana', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            token_contract: tokenContract,
            token_amount: tokenAmount,
            solana_address: solanaAddress
            })
        });
        response_data = response.json();
        if (response_data.status == true) {
            return response_data.result; // Deposit address on Xian
        }
        return null;
    }
    catch (error) {
        showToast("Could not connect to the bridge server", "error");
        return null;
    }
}

async function getStatusSolana(depositAddress) {
    try {
        const response = await fetch(apiUrl + '/solana_to_xian_status', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            address: depositAddress
            })
        });
        response_data = response.json();
        if (response_data.status == true) {
            return response_data.result; // Status of the deposit: created, deposited, sweeped, completed, expired
        }
        return null;
    }
    catch (error) {
        showToast("Could not connect to the bridge server", "error");
        return null;
    }
}

async function monitoringStatusLoopSolana(depositAddress, callback) {
    let status = await getStatusSolana(depositAddress);

    // Poll indefinitely until we reach completed or expired
    while (true) {
        if (!status) {
            // If we can’t fetch status at all, we break or handle an error
            console.warn('Unable to fetch status for:', depositAddress);
            return;
        }
        // Send this status up to the callback
        callback(status);

        if (status === 'completed' || status === 'expired') {
            // We’re done monitoring
            break;
        }
        // Wait 5 seconds, then check again
        await new Promise(r => setTimeout(r, 2000));
        status = await getStatusSolana(depositAddress);
    }
}


async function getStatusXian(depositAddress) {
    try {
        const response = await fetch(apiUrl + '/xian_to_solana_status', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            address: depositAddress
            })
        });
        response_data = response.json();
        if (response_data.status == true) {
            return response_data.result; // Status of the deposit: created, deposited, sweeped, completed, expired
        }
        return null;
    }
    catch (error) {
        showToast("Could not connect to the bridge server", "error");
        return null;
    }
}

async function monitoringStatusLoopXian(depositAddress, callback) {
    let status = await getStatusXian(depositAddress);

    // Poll indefinitely until we reach completed or expired
    while (true) {
        if (!status) {
            // If we can’t fetch status at all, we break or handle an error
            console.warn('Unable to fetch status for:', depositAddress);
            return;
        }
        // Send this status up to the callback
        callback(status);

        if (status === 'completed' || status === 'expired') {
            // We’re done monitoring
            break;
        }
        // Wait 5 seconds, then check again
        await new Promise(r => setTimeout(r, 2000));
        status = await getStatusXian(depositAddress);
    }
}
