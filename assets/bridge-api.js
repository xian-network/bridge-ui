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
        return "FXpSpewmZcujWUo9cNeQjq7MQe8S89fNJwEEhvJ2Pfi4";
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