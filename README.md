# How To Run the project

## 1. Setup project environment

Fill the following environment variables

```
SHOPIFY_API_KEY= # From Shopify Partner Account App
SHOPIFY_API_SECRET_KEY= # From Shopify Partner Account App
FORWARDING_ADDRESS= # Your end-point api
MONGODB_URL = You Mongodb url
```

### Note: Don't put extra "/" at the end of Forwarding Address

Example:
Do like this

```
FORWARDING_ADDRESS = https://yourdomain.com
```

Don't do like this

```
FORWARDING_ADDRESS = https://yourdomain.com/
```

## 2. Build the project

```
$ npm install
```

```
$ cd client && npm install && npm run build
```

## 3. Run the project

```
$ npm start
```

### Now App will be running on port 5000.

# How to Change Pricing

#### Go to repo. Then open pricingConfig.json

#### If you want to go for production, just test=true property
