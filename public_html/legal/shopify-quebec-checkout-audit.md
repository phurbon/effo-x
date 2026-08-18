# Shopify checkout audit — Québec distance sale

Audit date: 2026-08-17  
Storefront tested: `https://effo-x.com` → Shopify checkout  
Test product: Effo-X Hooded Scoundrel - Hoodie, size S, CA$59.99  
Scope: read-only review through the payment step; no customer data entered and no order submitted.

## Observed

| Requirement/control | Live result | Status |
|---|---|---|
| Product identity, variant and quantity | Name, size S and quantity 1 displayed | Pass |
| Item price | CA$59.99 displayed | Pass |
| Currency | CAD displayed in total | Pass |
| Opportunity to review before payment | Order summary shown beside payment form | Pass |
| Merchant legal name | Checkout shows brand “Effo-X,” not a verified legal entity | Fail |
| Merchant address | Only visible inside the generic Privacy modal | Partial |
| Merchant telephone | Not displayed; Privacy contact text says “call or email” but gives no number | Fail |
| Merchant email | Gmail address in Shopify Privacy modal; inconsistent with site `support@effo-x.com` | Fail / inconsistent |
| Detailed product characteristics | Checkout shows only name/size; storefront description is “95% cotton, 5% poly premium quality” | Partial |
| Itemized taxes | Not calculated until address is entered | Expected at this stage; verify with Québec test address |
| Shipping charge and method | Requires address; no pre-address estimate or policy link | Partial |
| Delivery date or timeframe | Not displayed before address; no shipping policy link | Fail pending configured rates |
| Total payable | Current subtotal/total shown; final total depends on address | Partial |
| Correction of order | Cart permits item removal/quantity changes before checkout | Pass |
| Cancellation/return/refund policy before purchase | No footer link in checkout | Fail |
| Terms of sale before purchase | No footer link in checkout | Fail |
| Privacy notice | Generic Shopify-generated Privacy modal exists | Partial; not Québec-specific and contact details incomplete |
| French checkout | URL and interface were `en-ca`; no visible language choice | Fail |
| Retainable contract/confirmation | Could not be tested without placing an order | Not tested |

## Required Shopify configuration

1. In Shopify **Settings → Store details**, set the verified registered entity, business address, monitored phone and domain email.
2. In **Settings → Policies**, replace generated boilerplate with counsel-approved French policies first and equivalent English versions: privacy, terms, shipping, refunds/returns and contact/legal notice.
3. Ensure all policy links appear in the checkout footer before `Pay now`.
4. Configure French as a published market language and translate products, variants, checkout, notifications, policies and customer accounts. A Québec consumer must receive the French standard-form contract before expressly choosing English.
5. In shipping profiles, configure exact rates, carriers/means and delivery estimates. Verify these appear after a Québec postal code is entered and before payment.
6. Verify taxes, shipping and the final CAD total with a non-sensitive test address controlled by Effo-X.
7. Customize order confirmation/notifications to include the merchant identity/contact, all required contract information, policies, selected products, itemized amounts, delivery details and a durable copy.
8. Align the Shopify privacy-policy contact with the public site and remove the contradictory Gmail address unless it is the intentional monitored privacy address.
9. Run and record two end-to-end test orders (French and English), then refund them. Retain screenshots/PDFs of checkout, confirmation page, email contract and refund.

## Important limitation

The final tax, shipping, delivery and post-purchase confirmation states require entering an address and placing an actual test order. That was not done during this audit. Counsel should review the saved evidence from the two controlled test orders.
