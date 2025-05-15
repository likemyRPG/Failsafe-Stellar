This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Dead Man's Wallet Checker

This service provides an API endpoint to check and trigger dead man's wallet contracts on the Stellar blockchain.

## How It Works

The API periodically checks wallets registered in the contract. If a user hasn't checked in before their deadline, the service will automatically trigger their dead man's wallet, initiating the transfer of assets to their beneficiaries.

## API Endpoints

### Check Wallets

**Endpoint:** `/api/check-wallets`

This endpoint performs an immediate scan of all registered wallets in the contract. It checks if any wallets have missed their check-in deadline and triggers them if necessary.

**Method:** POST

**Environment Variables Required:**
- `SERVER_SECRET_KEY` - The secret key of the account that will sign the trigger transactions
- `CONTRACT_ID` - The ID of the dead man's wallet contract

**Response Example:**
```json
{
  "message": "Wallet check completed successfully",
  "results": {
    "totalUsers": 5,
    "usersNotInDatabase": 1,
    "usersAlreadyTriggered": 1,
    "usersTriggered": 1,
    "usersActive": 2,
    "errors": 0
  }
}
```

## Generating a Server Secret Key

To use this service, you need a Stellar account to sign the trigger transactions. Here's how to get a server secret key:

### Using the Provided Script

1. Run the keypair generation script:
   ```bash
   node scripts/generate-keypair.js
   ```

2. The script will output a new Stellar keypair. Save the Secret Key in your environment variables.

3. Fund the account with XLM:
   - **Testnet**: Use the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test) friendbot
   - **Mainnet**: Transfer XLM from an exchange or another wallet

### Manual Creation

You can also create a keypair using the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator):

1. Go to the Account Creator in Stellar Laboratory
2. Select the network (Test or Public)
3. Generate a keypair by clicking "Generate keypair"
4. Save the secret key securely
5. Fund the account with XLM

### Security Best Practices

- Use a dedicated Stellar account for the service, not your personal account
- Store the secret key in environment variables, never in code
- For production, use secrets management services (AWS Secrets Manager, Google Secret Manager, etc.)
- Regularly monitor the account for sufficient XLM balance

## Setup Instructions

1. Set the following environment variables:
   - `SERVER_SECRET_KEY` - A Stellar account secret key with sufficient XLM to pay for transactions
   - `CONTRACT_ID` - The Soroban contract ID for the dead man's wallet contract

2. Deploy the service to your preferred hosting provider

3. Set up a cron job or scheduled task to call the `/api/check-wallets` endpoint regularly (e.g., every hour)

## Setting Up Scheduled Execution

The API needs to be called regularly to check for wallets that have exceeded their deadlines. Here are some options for setting up automatic execution:

### Using a Cron Service

Several cloud services offer cron job functionality:

#### Vercel Cron Jobs (if deployed on Vercel)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/check-wallets",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

#### GitHub Actions

```yaml
# .github/workflows/check-wallets.yml
name: Check Dead Man's Wallets

on:
  schedule:
    - cron: '0 */1 * * *'  # Every hour

jobs:
  check-wallets:
    runs-on: ubuntu-latest
    steps:
      - name: Call API Endpoint
        run: curl -X POST https://your-domain.com/api/check-wallets
```

#### Traditional Cron Job (on Linux/Unix)

```bash
# Run every hour
0 * * * * curl -X POST https://your-domain.com/api/check-wallets
```

#### AWS CloudWatch Events

You can set up a CloudWatch Events rule to trigger a Lambda function that calls your API endpoint every hour.

## Security Considerations

- The server secret key should be kept secure and only accessible to the service
- Consider using a dedicated Stellar account for this service instead of a personal account
- Ensure your environment variables are securely stored and not exposed in public repositories
- If using webhook or cron services, consider adding API authentication to prevent unauthorized calls

## Development

To run the service locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Add required environment variables to `.env.local` file:
   ```
   SERVER_SECRET_KEY=YOUR_SECRET_KEY
   CONTRACT_ID=YOUR_CONTRACT_ID
   ```
4. Start the development server: `npm run dev`
5. Test the API endpoint by making a POST request to http://localhost:3000/api/check-wallets
