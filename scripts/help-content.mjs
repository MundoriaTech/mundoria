/** Mundoria Help Centre collections + articles. Publish with `npm run seed:help`. */

export const HELP_COLLECTIONS = [
  {
    "audience": "customers",
    "description": "Booking, payments, cancellations and getting the most from your clean.",
    "id": "11111111-1111-4111-8111-111111111101",
    "slug": "for-customers",
    "sort_order": 10,
    "title": "For customers"
  },
  {
    "audience": "cleaners",
    "description": "How to apply, documents we need, and what happens after you sign up.",
    "id": "11111111-1111-4111-8111-111111111102",
    "slug": "become-a-cleaner",
    "sort_order": 20,
    "title": "Become a Mundoria cleaner"
  },
  {
    "audience": "cleaners",
    "description": "Jobs, checklists, messaging and payouts once you are live.",
    "id": "11111111-1111-4111-8111-111111111103",
    "slug": "cleaner-guide",
    "sort_order": 30,
    "title": "Cleaner guide"
  }
];

const C = HELP_COLLECTIONS;

export const HELP_ARTICLES = [
  {
    body: `You book a Mundoria clean online in a few guided steps on the [booking page](/booking/new). You choose the service, add the address, rooms and time, then see the full price before you confirm. Your card is saved with no charge, and the booking stays a request until a cleaner accepts it.

## What are the steps?
1. Under **What do you need?**, choose the type of cleaning and the service that fits the job.
2. Under **Where will your cleaning take place?**, type the address and pick a suggestion from the list.
3. Tell us about the rooms, any extras or supplies you want, and how long the clean should take.
4. Choose a date, an arrival time and, where the service allows it, how often the session should repeat.
5. Answer **Do you have any pets?** for any booking that is not a workspace clean.
6. If you are not signed in, sign in or create an account so we can send your booking details.
7. On **Ready to book your clean?**, add any specific requirements, choose or add a card, then tap **Book my cleaning**.

Office bookings add a step for the size of the office, and recovery bookings add a step for recovery preferences. The basket keeps a running total as you go, and [how prices are set](/help/article/how-are-prices-set) explains what changes it.

## What should I have ready?
- The full address, including the postcode. If it will not appear, see [address not recognised](/help/article/address-not-recognised).
- The number of bedrooms and bathrooms, or the spaces in a workplace.
- Access, parking and anything the cleaner should avoid, for the requirements box at checkout.
- Details about any animals at the property, as explained in [pets when booking](/help/article/pets-when-booking).

## What happens after I book?
Mundoria matches a suitable cleaner on service, postcode, availability and reliability. The cleaner's name stays hidden until they accept, and you get an email when the session is confirmed. You can follow every booking under **Sessions** in your account.

Your card is not charged when you book. From 48 hours before the visit, once a cleaner is assigned, a temporary hold is placed on it. Payment is taken the day after the clean, as set out in [why we save your card](/help/article/why-pay-in-advance). The whole journey is described on [How it works](/how-it-works).

## Can I book for someone else?
Yes. Enter the address of the property being cleaned and add access details in the requirements box at checkout. The booking and the payment stay on your own account. If you have had a completed visit before, the flow may also ask **Request a cleaner you already know?** after the address.

> Tip: cancelling is free until 24 hours before the start time, so it is worth booking early and adjusting later if plans change.`,
    collection_id: C[0].id,
    slug: "how-do-i-book",
    sort_order: 10,
    summary: "Book online in a few guided steps: choose the service, add the address and time, check the full price, then save your card with no charge.",
    title: "How do I book a cleaner on Mundoria?",
    topic: "Book a clean",
  },
  {
    body: `Mundoria prices are based on time: an hourly rate for the service, multiplied by the hours the clean is expected to take. Extras, supplies and early, evening or weekend arrival times are added on top. You see the full price before you confirm, and there is no booking fee.

## What affects the price?
- **The service.** Each service has its own hourly rate, and deeper cleans cost more per hour than routine cleans.
- **The hours.** The booking flow suggests a length from your bedrooms, bathrooms and other rooms, and you can change it under **How long?**.
- **Extras.** Tasks such as cleaning inside the oven or fridge are priced as add-ons.
- **Supplies.** Use your own products and equipment, or add Mundoria's product kit or equipment for an extra charge.
- **Arrival time.** Arrivals before 9am or from 5pm, and weekend arrivals, can cost more than weekday daytime.
- **How often.** If you choose regular house cleaning but pick a one-off visit, the one-off rate applies.

For offices, the price is worked out from the spaces you enter, which are turned into cleaner-hours. There is no separate bank holiday surcharge, and Mundoria does not add a separate VAT line at checkout.

## Where do I see the current rates?
Rates come from Mundoria's rate card and can change, so this article does not list them. The live figures are on the [booking page](/booking/new) as you build your booking, and the [pricing FAQ](/faq/pricing) answers common questions. Before you tap **Book my cleaning**, the basket shows the cleaning total, any extras and any promo discount.

## Will the price change after I book?
The price you confirm is the price of the visit. You pay for the time you booked, not the time the cleaner happened to take on the day. If a clean needs more time, extra hours are only added when they are available and you agree the cost first.

Two rules can lead to a charge you did not plan for. Cancelling within 24 hours of the start time costs the full booking price, as set out in [payment and cancellation](/help/article/payment-and-cancellation). A waiting charge can also apply if the cleaner cannot get in after a 5-minute grace period.

## How can I keep the cost down?
- Book the hours you need and list the rooms that matter most, so the time goes where you want it.
- Provide your own products and equipment instead of adding supplies.
- Choose a weekday daytime arrival where you can.
- Apply a valid code at checkout, as explained in [promo codes](/help/article/promo-codes).

Ready to see your price? Follow the steps in [how to book](/help/article/how-do-i-book).`,
    collection_id: C[0].id,
    slug: "how-are-prices-set",
    sort_order: 20,
    summary: "Prices come from an hourly rate for the service, the estimated hours, extras, supplies and your arrival time, all shown before you confirm.",
    title: "How are Mundoria prices worked out?",
    topic: "Book a clean",
  },
  {
    body: `Mundoria takes payment by card, processed securely by Stripe through the booking checkout. Cash, cheques and bank transfers are not accepted, and you never pay the cleaner directly. Where your device supports it, a wallet button such as Apple Pay or Google Pay may also appear.

## How do I add a card?
1. Reach **Ready to book your clean?** at the end of the booking flow.
2. Under **Your payment method**, enter your card details, or pick a card you saved before.
3. To use another card, choose **Use a different card** and enter the new details.
4. Tap **Book my cleaning**. Your card is saved with no charge at this point.

If a wallet button appears above the card form, you can use it instead of typing a card. The card types accepted are the ones shown at checkout.

## When is my card charged?
Saving the card does not charge it. From 48 hours before the visit, once a cleaner is assigned, Mundoria places a temporary hold. Payment is taken the day after the clean, and [why we save your card](/help/article/why-pay-in-advance) explains each stage.

An optional tip is a separate card payment, made in its own step after the clean.

## How do I manage saved cards?
Open **Account** and choose **Payment methods**. This opens Stripe's secure payment settings, where your saved cards are managed. Mundoria does not store your full card number, only the Stripe references needed to run your bookings.

If a booking shows **Payment hold needs attention**, use **Update card** on that booking. Saving a working card there retries the hold straight away. [Payment failed](/help/article/payment-failed) covers this in more detail.

## Why can I not pay in cash?
Mundoria is cashless. Keeping payment on the platform gives you a clear record of every booking, and it helps if something needs to be reviewed later. Never send card details to a cleaner or in a chat message.

## Where do I find my receipts?
After a paid clean, your invoice is on the booking and under **Payments & receipts** in your account. See [get an invoice](/help/article/get-an-invoice) for the steps. The [payments FAQ](/faq/payments) has more answers about cards, timing and refunds.`,
    collection_id: C[0].id,
    slug: "payment-methods",
    sort_order: 30,
    summary: "Mundoria takes card payments through Stripe at checkout. Cash, cheques and bank transfers are not accepted, and you never pay the cleaner directly.",
    title: "Which payment methods can I use?",
    topic: "Book a clean",
  },
  {
    body: `You do not pay in advance with Mundoria. When you book, your card is saved securely with Stripe and nothing is charged. A temporary hold is placed from 48 hours before the visit once a cleaner is assigned, and payment is taken the day after the clean.

## Why save a card at all?
A saved card lets Mundoria confirm the visit without asking you to pay up front. The cleaner sets the time aside, and the hold shows the funds are there before they travel. If no cleaner can take the booking, no hold is placed and you are not charged.

## What happens at each stage?
| Stage | What the booking shows | What happens to your card |
| --- | --- | --- |
| You book | Card on file | Saved, with no charge and no hold |
| From 48 hours before, once a cleaner is assigned | Payment held | A temporary hold for the booking amount |
| The day after the clean | Paid | The held amount is taken and your receipt is ready |
| You cancel 24 hours or more ahead | Cancelled | No charge, and any hold is released |

## What is a hold?
A hold, or authorisation, reserves the booking amount on your card without taking it. Your banking app may show it as a pending amount. Card providers can take a few days to remove a pending amount after it is released.

## What if the hold cannot be placed?
Mundoria lets you know and tries again, up to five times between 48 and 24 hours before the clean. You can tap **Update card** on the booking to retry at once. If the hold still fails by 24 hours before, the booking is cancelled free of charge. [Payment failed](/help/article/payment-failed) explains what to do.

## Can I cancel after my card is saved?
Yes. Cancelling 24 hours or more before the start time is free, and any hold is released. Within 24 hours the full booking price is charged, because the cleaner has set that time aside. See [payment and cancellation](/help/article/payment-and-cancellation) for the full rules.

## Where can I check the payment status?
Open the booking and look at the payment section, or see **Payments & receipts** in your account. [Payment methods](/help/article/payment-methods) explains which cards and wallets you can use. The full journey, from booking to payment, is on [How it works](/how-it-works).`,
    collection_id: C[0].id,
    slug: "why-pay-in-advance",
    sort_order: 40,
    summary: "You do not pay in advance. We save your card with no charge, hold the amount from 48 hours before once a cleaner is assigned, then charge the day after.",
    title: "Why do you save my card when I book?",
    topic: "Book a clean",
  },
  {
    body: `Cancelling 24 hours or more before the start time is free, and any card hold is released. Cancelling within 24 hours costs the full booking price, because the cleaner has set that time aside. If the clean goes ahead, payment is taken the day after the clean.

## How does payment work?
1. You save a card when you book. Nothing is charged at this point.
2. From 48 hours before the visit, once a cleaner is assigned, a temporary hold is placed for the booking amount.
3. The day after the clean, the held amount is taken and your receipt becomes available.

[Why we save your card](/help/article/why-pay-in-advance) covers each stage in more detail.

## What does cancelling cost?
| When you cancel | What you pay |
| --- | --- |
| 24 hours or more before the start time | Nothing, and any hold is released |
| Less than 24 hours before the start time | The full booking price |

The 24 hours are counted back from the booked start time. Before you confirm, the cancellation window tells you whether the cancellation is free. Your statutory consumer rights are not affected.

## How do I cancel or move a booking?
Open the booking from **Sessions**, choose **Cancel booking** and give a short reason. For a regular series, you can choose **This visit only** or **This visit and all future visits**. [How to cancel](/help/article/how-do-i-cancel) walks through each step.

Moving a booking is free while it is 24 hours or more away, using **Reschedule** on the booking. Inside 24 hours the reschedule option is not available, so a change becomes a cancellation. See [changing a booking](/help/article/modify-booking).

## What if Mundoria or the cleaner cancels?
Mundoria looks for a suitable replacement. If no one can take the visit, you are offered another time or the booking is cancelled. You are not charged for a clean that did not happen: any hold is released, or a payment already taken is refunded. [Late or no-show cleaners](/help/article/cleaner-late-or-no-show) explains what happens on the day.

## What if my card hold fails?
If the hold cannot be placed by 24 hours before the clean, the booking is cancelled free of charge. No cancellation fee applies when a booking is cancelled for this reason.

## When will I see my money back?
Card providers can take a few days to remove a pending amount or show a refund. The [cancellations FAQ](/faq/cancellations) answers more questions about changes and fees.`,
    collection_id: C[0].id,
    slug: "payment-and-cancellation",
    sort_order: 50,
    summary: "Cancel free 24 hours or more before the start time. Within 24 hours the full price is charged. If the clean goes ahead, you pay the day after.",
    title: "How do payment and cancellation work?",
    topic: "Book a clean",
  },
  {
    body: `If your card could not be saved at checkout, check the details or try another card, then tap Book my cleaning again. If the payment hold fails before a clean, update the card on the booking. Mundoria retries up to five times, and cancels the booking free of charge if the hold still fails by 24 hours before.

## The card would not save at checkout
1. Check the card number, expiry date and security code.
2. If your bank asks you to confirm, complete the check in your banking app or the window that opens.
3. Try a different card, or a wallet button if one is shown.
4. If it still fails, note the message shown and get in touch from [Contact us](/contact).

The booking is only created after the card is saved, and saving a card never charges it.

## The hold failed before my clean
From 48 hours before the visit, once a cleaner accepts, Mundoria places a temporary hold on your saved card. If that fails, the booking shows **Payment hold needs attention** and we notify you. Common reasons are an expired card, a declined hold, low funds, or a bank asking for extra confirmation.

1. Open the booking from **Sessions**.
2. Tap **Update card** and save a working card.
3. Mundoria retries the hold straight away with the new card.

If you do nothing, Mundoria tries again up to five times between 48 and 24 hours before the clean. If the hold still cannot be placed by 24 hours before, the booking is cancelled free of charge. You can then choose **Book again** on the cancelled booking.

## A booking says Payment due
A booking with no saved card shows **Payment due**. Open **Payments & receipts** and choose **Authorise**, or use the save card button on the booking itself. Your card is saved, not charged, and the usual hold steps then follow.

## What should I avoid?
Do not pay the cleaner directly or send card details in a message. Payment always stays on Mundoria, even when something has gone wrong.

## Where can I read more?
[Payment methods](/help/article/payment-methods) lists the ways you can pay. [Why we save your card](/help/article/why-pay-in-advance) explains the hold and the next-day charge. If a failed hold led to a cancellation, no fee applies, as set out in [payment and cancellation](/help/article/payment-and-cancellation).`,
    collection_id: C[0].id,
    slug: "payment-failed",
    sort_order: 60,
    summary: "If your card will not save, check it or try another. If a hold fails, update the card on the booking. Unpaid holds cancel free 24 hours before.",
    title: "My payment didn't go through. What should I do?",
    topic: "Book a clean",
  },
  {
    body: `You add a promo code at the last step of the booking flow, before you tap Book my cleaning. Choose **Add a promo code**, type the code and tap **Add**, and the discount appears as a **Promo** line in your basket. You need to be signed in, and the code applies once your address is saved. If your address will not save, see [address not recognised](/help/article/address-not-recognised).

## How do I apply a code?
1. Build your booking on the [booking page](/booking/new) and reach **Ready to book your clean?**.
2. In the basket, choose **Add a promo code**.
3. Type the code and tap **Add**, or press Enter.
4. Check the **Promo** line and the new total, then tap **Book my cleaning**.

The basket takes one code at a time. There is no option to add a code to a booking after it has been made. [How prices are set](/help/article/how-are-prices-set) explains the total the discount is taken from.

## Where do I find my vouchers?
Open **Payments & receipts** in your account. **Your vouchers** lists each active code, what it is for and when it expires. A code can be a general promo, a welcome gift or a referral reward.

## How do referral codes work?
Your referral code is on your **Account** page, with buttons to copy the code or an invite link. A friend can enter it under **Referral code (optional)** when they sign up, or at checkout on their first booking. They get a welcome voucher for their first booking. You get a voucher after their first completed clean, for up to 10 active referrals.

The current amounts are shown under your code on the Account page. [Modify your profile](/help/article/modify-profile) shows where to find it.

## Why was my code not accepted?
- **That promo code is invalid or has expired.** Check the spelling, or the code may have ended. You also cannot use your own referral code.
- **That promo code has already been used.** The code has reached its use limit.
- **That promo code belongs to another account.** Personal vouchers only work on the account they were issued to.
- **Referral codes can only be used on your first booking.** A friend's code only works before your first completed clean.

## Does a code change how payment works?
No. The discounted total is the amount linked to your saved card. The hold and the next-day charge follow the usual steps. New to Mundoria? Start with [how to book](/help/article/how-do-i-book).`,
    collection_id: C[0].id,
    slug: "promo-codes",
    sort_order: 70,
    summary: "Add a promo, voucher or friend's referral code at checkout under Add a promo code. The discount shows in your basket before you book.",
    title: "How do I use a promo code or voucher?",
    topic: "Book a clean",
  },
  {
    body: `You rate a cleaner from the completed booking in your account. Choose **Leave a rating**, pick the option that matches your experience, and add a comment if you want to. Each completed booking can be rated once, and only customers with a completed booking can leave a rating.

## How do I leave a rating?
1. Open the booking from **Sessions** once the clean is complete.
2. The **Rate your clean** window usually opens by itself. If not, choose **Leave a rating** under **How was your clean?**.
3. Pick one of five options: Excellent, Good, Fair, Bad or Awful.
4. Add anything else you want Mundoria to know in the comment box. This part is optional.
5. Tap **Submit feedback**. The booking then shows **Rated**.

If the booking is still waiting for you to confirm the work, confirm it first. The rating option appears once the booking is complete.

## What happens to my rating?
Ratings feed into the cleaner's quality score, which customers see as a medallion rather than a number. Mundoria looks at patterns across bookings, not at one rating on its own. A Bad or Awful rating is held for 48 hours, so the cleaner can dispute it before it counts.

A written comment may later appear on the Mundoria website next to your first name. Only feedback from completed bookings is ever shown there.

## Can I change my rating?
Not at the moment. A submitted rating is final. If you need to add something, message Mundoria from [Contact us](/contact) instead.

## Something went wrong. Should I still rate it?
Rate the clean honestly, and report the problem separately so the team can review it. Use **Report issue** on the booking. [Not satisfied with a clean](/help/article/not-satisfied) explains the options, and [report a claim](/help/article/report-a-claim) covers damage or loss.

## Can I thank my cleaner another way?
Yes. You can add a tip for 24 hours after the clean, as explained in [how to tip](/help/article/how-to-tip). If you were happy, you can also ask for the same person next time, as described in [rebook the same cleaner](/help/article/rebook-same-cleaner). The [reviews FAQ](/faq/reviews) has more answers.`,
    collection_id: C[0].id,
    slug: "rate-and-review",
    sort_order: 80,
    summary: "Open the completed booking and choose Leave a rating. Pick one of five ratings, add an optional comment and submit. Each booking is rated once.",
    title: "How do I rate my cleaner and leave a review?",
    topic: "Book a clean",
  },
  {
    body: `Tipping is optional, and you can tip from the booking for 24 hours after the clean. Open the booking, choose an amount under **Leave a tip** and pay by card. You can leave one tip per booking.

## How do I leave a tip?
1. Open the finished booking from **Sessions**.
2. Find the **Leave a tip** panel, which appears once the clean has finished.
3. Choose one of the set amounts shown.
4. Enter your card details in the card field.
5. Tap the **Tip** button, which shows the amount you chose.

When the tip goes through, the panel disappears from the booking. If the card is declined, you see **Tip not taken** with the reason, and you can try again with another card.

## When can I tip?
- The panel appears once the clean is marked as finished, including while the booking waits for you to confirm it.
- It stays open for 24 hours after the clean ends.
- After that, or once a tip is recorded, the panel no longer shows.

## How is a tip paid?
A tip is a separate card payment, taken straight away. It is not part of the booking hold or the next-day charge for the clean. You enter a card in the tip panel each time, even if you have a card saved for bookings. [Payment methods](/help/article/payment-methods) explains how booking payments work.

Never hand a cleaner your card details or pay them privately. Keep every payment, including tips, on Mundoria.

## Is tipping expected?
No. The booking price covers the clean, and there is no pressure to tip. If you want to say thank you in another way, an honest rating helps the cleaner too. See [rate and review](/help/article/rate-and-review).

## Need a record of the booking?
The invoice for the clean itself is on the booking once it has finished. [Get an invoice](/help/article/get-an-invoice) explains how to download it.

## The tip panel is missing
Check that the clean is finished and that fewer than 24 hours have passed since it ended. Check too that a tip has not already been recorded on the booking. For any other problem, message Mundoria from [Contact us](/contact).`,
    collection_id: C[0].id,
    slug: "how-to-tip",
    sort_order: 90,
    summary: "Tipping is optional. For 24 hours after the clean, open the booking, choose an amount under Leave a tip and pay by card. One tip per booking.",
    title: "How do I tip my cleaner?",
    topic: "Book a clean",
  },
  {
    body: `Yes. Once the clean is finished, open the booking and choose **Download invoice**, or open **Payments & receipts** and choose **View receipt**. The invoice shows the service, date, address, the amount charged and the payment status.

## How do I download it?
1. Open the booking from **Sessions**, or go to **Payments & receipts** in your account.
2. Choose **Download invoice** on the booking, or **View receipt** in the list of past receipts.
3. On the **Booking invoice** page, choose **Download invoice**.
4. Your browser's print window opens. Choose the save as PDF option to keep a copy, or print it.

## When is it available?
The invoice link appears on the booking once the clean has finished. Payment is taken the day after the clean, so the status on the invoice changes from **Payment held** to **Paid** at that point. **Past receipts** lists a booking once its payment has been taken. [Why we save your card](/help/article/why-pay-in-advance) explains the timing.

## What does it include?
- A booking reference, the payment status and the service booked.
- Your name and email under **Billed to**.
- The date, start time and property address.
- The cost of the clean, any extras, and the total charged.

## Can I add company details or a VAT number?
The invoice uses the name and email on your account. There is no field to add a company name or VAT number yourself. If you need either, message Mundoria from [Contact us](/contact) with the booking reference. Mundoria does not currently add a separate VAT line at checkout.

## What about tips?
A tip is a separate card payment made after the clean, so it is not part of the booking total. See [how to tip](/help/article/how-to-tip) for how tipping works. For the cards you can use on bookings, see [payment methods](/help/article/payment-methods).

## Anything else after the clean?
While you are on the finished booking, you can also leave feedback about the visit. [Rate and review](/help/article/rate-and-review) explains how ratings work and who sees them.`,
    collection_id: C[0].id,
    slug: "get-an-invoice",
    sort_order: 100,
    summary: "Yes. Open the booking and choose Download invoice once the clean is done, or find it under Payments & receipts. Save it as a PDF from your browser.",
    title: "Can I get an invoice for my booking?",
    topic: "Book a clean",
  },
  {
    body: `The booking flow asks **Do you have any pets?** on the scheduling step, after you choose a date and time. Choose **Yes, pets** or **No, none**, then describe the animals in the **Any specific requirements?** box at checkout. Your answer is added to the booking notes your cleaner sees.

## Where is the pets question?
1. Build your booking on the [booking page](/booking/new) and reach the date and time step.
2. Under **Do you have any pets?**, choose **Yes, pets** or **No, none**. You need to answer before you can continue.
3. At **Ready to book your clean?**, use **Any specific requirements?** to describe the animals.

The question appears for house, moving, short-let and recovery bookings. Workspace bookings do not ask it, so use the requirements box if animals will be on site.

## What should I write?
- What animals you have and how many.
- Whether they will be at home during the clean, and where they will be.
- Doors or gates that must stay closed.
- Rooms, beds or furniture to leave alone, and any products to avoid around them.
- Areas with pet hair or litter that you want the cleaner to focus on.

## Why does it matter?
Some cleaners have allergies or prefer not to work around animals. Telling us before the visit means your cleaner knows what to expect when they arrive. Pet hair can also add time, so keep it in mind when you choose how long the clean should take. [How to book](/help/article/how-do-i-book) covers the hours step.

## Can I add details after booking?
Once a cleaner is assigned, you can message them in the app about your pets. See [message your cleaner](/help/article/how-do-i-message-my-cleaner) for how chat works. [Prepare for a clean](/help/article/prepare-for-a-clean) covers getting your home ready for the visit.

> Tip: if your pet is nervous with visitors, say so in the requirements box and plan where they will stay during the clean.`,
    collection_id: C[0].id,
    slug: "pets-when-booking",
    sort_order: 110,
    summary: "Answer Do you have any pets? when you choose your time, then add the details in the requirements box at checkout so your cleaner can prepare.",
    title: "I have pets. How do I tell you when booking?",
    topic: "Book a clean",
  },
  {
    body: `The address box searches UK addresses as you type, and you must pick a suggestion from the list. Start with the house number and street, then add the postcode if the right address does not appear. If it still will not show, contact Mundoria with the full address.

## How do I enter my address?
1. Under **Where will your cleaning take place?**, type the number, street, city and postcode.
2. Wait for the list of suggestions to appear below the box.
3. Pick the matching address. The city and postcode then show under the box.
4. Carry on with the rest of your booking.

The search starts after you type three characters. Typing the address without choosing a suggestion will not work, because the city and postcode come from the suggestion.

## What do the error messages mean?
- **Start typing and pick an address from the suggestions.** You typed an address but did not choose one from the list.
- **Pick a suggestion that includes city and postcode.** The suggestion you chose is missing a city or postcode, so choose a fuller match.
- **Address search failed. Try again in a moment.** The search service did not respond, so wait and try again.
- **Couldn't reach address search.** Check your internet connection, then try again.

## What if the right address is missing?
- Try the house number followed by the postcode.
- Leave out the flat number, pick the building, then add the flat number in **Any specific requirements?** at checkout.
- Check the postcode spelling and the space in the middle.
- For a new-build, try the street name and postcode.

## Is my area covered?
Mundoria is currently focused on Birmingham, with coverage developing across the wider West Midlands. The address search accepts any UK address, but matching works from your full postcode. If no cleaner confirms before the visit, the booking is cancelled and you are not charged.

## How do I use a saved address?
Signed-in customers can open **View my saved addresses** in the booking flow and pick one. To add, edit or remove addresses, open **Account** and choose **Manage addresses**, as described in [modify your profile](/help/article/modify-profile).

## What comes next?
After the address, the booking asks about rooms, timing and pets, as set out in [how to book](/help/article/how-do-i-book) and [pets when booking](/help/article/pets-when-booking). If none of this helps, message us from [Contact us](/contact) and include the full address.`,
    collection_id: C[0].id,
    slug: "address-not-recognised",
    sort_order: 120,
    summary: "Type the house number, street and postcode, then pick a suggestion from the list. If your address still will not appear, contact us for help.",
    title: "My address is not recognised. What can I do?",
    topic: "Book a clean",
  },
  {
    body: `Open **Account** in the menu to see your profile. From there you can change your photo, phone number, email address and notification choices. Your name cannot be edited in the app, so message Mundoria if it needs correcting.

## What can I change?
| Detail | How to change it |
| --- | --- |
| Profile photo | Upload a new photo at the top of the page |
| Email | Choose **Change email** and confirm the new address |
| Phone | Edit the number, then tap **Save changes** |
| Notifications | Turn email, SMS and push notifications on or off, then tap **Save changes** |
| Full name | Shown but not editable, so contact Mundoria |

## How do I save my changes?
1. Open **Account** from the menu.
2. Edit your phone number or your notification choices.
3. Tap **Save changes**. A short message confirms that your profile is saved.

Email changes have their own steps, set out in [change your email](/help/article/change-email). Phone changes are covered in [change your phone number](/help/article/change-phone).

## What else is on the Account page?
- **Manage addresses**, to add, edit or remove saved addresses.
- **Payment methods**, to manage saved cards in Stripe's secure settings.
- **Payments & receipts**, for your vouchers and past receipts.
- **Referral code**, with buttons to copy the code or an invite link. See [promo codes](/help/article/promo-codes).
- **Log out**, to sign out on this device.

## How do I change my name?
The name field is locked once the account is set up. Message Mundoria from [Contact us](/contact) with the correct name and ask for it to be updated.

## Can I turn off messages from Mundoria?
Yes. Under **Notification preferences**, switch email, SMS or push notifications off, then tap **Save changes**. You can switch them back on at any time from the same page.

## Want to close your account?
There is no delete button in the app. [Delete your account](/help/article/delete-account) explains how to ask Mundoria to close it.`,
    collection_id: C[0].id,
    slug: "modify-profile",
    sort_order: 210,
    summary: "Open Account to update your photo, phone, email and notification choices, manage addresses and saved cards, and copy your referral code.",
    title: "How do I change my profile details?",
    topic: "Manage my account",
  },
  {
    body: `Open **Account**, choose **Change email**, then enter the new address and your current password. Mundoria sends a confirmation link to the new address and tells your current address that a change was requested. Your current email keeps working for sign-in until you open that link.

## How do I change it?
1. Open **Account** from the menu.
2. Under **Email**, choose **Change email**.
3. Enter the **New email** and your **Current password**.
4. Tap **Send confirmation**.
5. Open the confirmation email in the new inbox and follow the link.

If a confirmation email also reaches your current inbox, open that link too. Once the change is confirmed, sign in with the new address.

## Why do you need my password?
Your email is your sign-in identity, so Mundoria checks it is really you before changing it. If the password is wrong, you see **Current password is incorrect.** If you have forgotten it, [reset your password](/help/article/reset-password) first. If you usually sign in with Google, you may need to set a password the same way.

## What other messages might I see?
- **That is already your email address.** The new address matches the one you use now.
- **Enter a valid email address.** Check the new address for typos.

## The confirmation email has not arrived
Check the spam or junk folder of the new inbox, and make sure you typed the new address correctly. If the address was wrong, start again from **Change email**. Your current email keeps working while the change is pending.

## I cannot get into my old email
Message Mundoria from [Contact us](/contact) and ask for an account recovery check. Support may ask you to confirm details such as a recent booking reference, the booking address, or the last four digits of the card used. Never share your password in chat.

## Related changes
Your phone number is changed on the same page, as explained in [change your phone number](/help/article/change-phone). For your photo, notifications and other settings, see [modify your profile](/help/article/modify-profile).`,
    collection_id: C[0].id,
    slug: "change-email",
    sort_order: 215,
    summary: "Choose Change email on your Account page, enter the new address and your current password, then open the confirmation link sent to the new inbox.",
    title: "How do I change my email address?",
    topic: "Manage my account",
  },
  {
    body: `Open **Account**, edit the **Phone** field and tap **Save changes**. Customers do not need to confirm the new number with an SMS code. Every account must keep a phone number, so if you remove it, you are asked to add one before you can carry on.

## How do I change it?
1. Open **Account** from the menu.
2. Replace the number in the **Phone** field.
3. Tap **Save changes**. A short message confirms that your profile is saved.

Use a number you can answer on the day of a clean, in case anything about the visit needs sorting quickly.

## What is my phone number used for?
Mundoria asks for a phone number for booking updates and marketplace safety. If SMS notifications are switched on, some updates can arrive by text. You can turn SMS, email and push notifications on or off on the same page.

## Can I stop text messages without removing my number?
Yes. Under **Notification preferences**, switch off SMS notifications and tap **Save changes**. Your number stays on the account, because every account needs one, but text updates stop until you switch them back on.

## Why was I sent to Complete your profile?
Every signed-in account needs a phone number. If the number is missing, for example after signing up with Google, Mundoria shows **Complete your profile** and asks you to add one. Once it is saved, you go back to the page you were trying to open.

## Is it different for cleaners?
Yes. Cleaner accounts confirm a new number with a 6-digit SMS code before Mundoria trusts it for job contact. Changing a cleaner's number resets that check until the new code is entered. This article covers customer accounts.

## Related changes
To change the email you sign in with, see [change your email](/help/article/change-email). For your photo, notifications and saved addresses, see [modify your profile](/help/article/modify-profile). If you cannot get into your account at all, message Mundoria from [Contact us](/contact).`,
    collection_id: C[0].id,
    slug: "change-phone",
    sort_order: 218,
    summary: "Edit the Phone field on your Account page and tap Save changes. Customers do not need an SMS code, but every account must keep a number.",
    title: "How do I change my phone number?",
    topic: "Manage my account",
  },
  {
    body: `Choose **Forgot Password?** on the sign-in page and enter the email on your Mundoria account. We email you a secure reset link. Open it, set a new password, then sign in again.

## How do I reset it?
1. Go to the sign-in page and choose **Forgot Password?**.
2. Enter your email and send the request.
3. Open the email from Mundoria and follow the link.
4. On **Set a new password**, enter a **New password** and type it again under **Confirm new password**.
5. Tap **Update password**. You are signed out and taken back to sign in.
6. Sign in with your new password.

Mundoria also emails you to confirm that your password was changed. If you did not make the change, contact us straight away.

## What makes a valid password?
Your new password needs all of these:
- An uppercase letter.
- A lowercase letter.
- A number.
- A symbol, such as # or !.
- At least 8 characters.

## The email has not arrived
- Check your spam or junk folder.
- Make sure you entered the email you signed up with. For privacy, the page looks the same whether or not an account exists.
- Wait a few minutes, then request a new link.
- If you usually use **Continue with Google**, you can sign in that way instead.

## The link does not work
Reset links work once and expire after a while. Request a new link from **Forgot Password?** and use the newest email you receive.

## I no longer use the email on my account
If you cannot reach that inbox, a reset link cannot get to you. See [change your email](/help/article/change-email) for the recovery route, or message Mundoria from [Contact us](/contact). Never share your password in chat.

## Related help
For other account settings, see [modify your profile](/help/article/modify-profile). If you want to stop using Mundoria altogether, [delete your account](/help/article/delete-account) explains how.`,
    collection_id: C[0].id,
    slug: "reset-password",
    sort_order: 220,
    summary: "Choose Forgot Password? on the sign-in page, enter your email and open the reset link we send. Then set a new password and sign in again.",
    title: "How do I reset my password?",
    topic: "Manage my account",
  },
  {
    body: `There is no button to delete your account in the app. To close it, cancel any upcoming bookings, then message Mundoria from [Contact us](/contact) and ask for the account to be closed. Some booking and payment records are kept after closure where they are needed for accounting, disputes or the law.

## What should I do before asking?
1. Cancel any upcoming bookings, including the rest of a regular series. [How to cancel](/help/article/how-do-i-cancel) explains the steps, and the 24-hour rule still applies.
2. Let any recent clean finish its payment, which is taken the day after the visit.
3. Use any vouchers you want, because they belong to the account.
4. Turn off email, SMS and push notifications on **Account** if you want them to stop straight away.

## How do I ask?
Open [Contact us](/contact) and choose **Contact us** to start a chat. Say you want your account closed and give the email you sign in with. Support may ask you to confirm details, such as a recent booking reference, before acting. For privacy requests you can also email support@mundoriauk.com, as listed in the [privacy policy](/privacy).

## What is kept after closure?
An account that was never used for a booking can usually be removed completely. Where an account has bookings, payments, ratings or disputes, Mundoria keeps the records it needs for accounting, disputes and legal reasons. The privacy policy explains your rights, including asking for information to be deleted where the law allows.

## What about my saved cards?
Card details are held by Stripe, not by Mundoria. Before you go, open **Account** and choose **Payment methods** to manage your saved cards. [Payment methods](/help/article/payment-methods) explains how cards are stored.

## Do I need to delete my account to stop?
No. There is no subscription or minimum term, so you can cancel future visits and simply stop booking. Your account stays ready if you come back later.

If you are leaving because you cannot sign in, try [reset your password](/help/article/reset-password) first. For everything you can change instead of closing the account, see [modify your profile](/help/article/modify-profile).`,
    collection_id: C[0].id,
    slug: "delete-account",
    sort_order: 230,
    summary: "There is no delete button in the app. Cancel any upcoming bookings, then ask Mundoria to close your account through the Contact us chat.",
    title: "How do I delete my Mundoria account?",
    topic: "Manage my account",
  },
  {
    body: `A Safety alert tells the Mundoria team that you need urgent attention during a live visit. If you or anyone else is in immediate danger, call 999 first, because Mundoria cannot replace the emergency services.

## When can I use a Safety alert?
The option appears on your booking on the day of the visit, once the booking is confirmed. It stays available while your cleaner is on the way and while the clean is in progress. Use it if you feel unsafe, if someone is unwell or has had an accident, or if there is an urgent access or property concern.

## How do I raise one?
1. Open the visit from [your bookings](/bookings).
2. Under **Need help?**, choose **Safety alert**.
3. If you are in danger, tap **Call 999**. Otherwise choose **Also alert Mundoria**.
4. Pick the reason that matches the situation and add an optional private note.
5. Press and hold **Hold to send safety alert** until the bar fills.

The hold step stops alerts being sent by accident. Your device may ask to share your location, which is optional.

## What happens after I send it?
- The Mundoria team is alerted straight away with the booking details and your reason.
- The booking goes on a safety hold, so check-in and completion stay paused until the team clears it.
- Your cleaner is told that an alert was raised, but they never see your private note.
- A team member will respond. Stay somewhere you feel safe while you wait.

Chat with your cleaner stays open during the review, and Mundoria can see that thread. See [How do I message my cleaner?](/help/article/how-do-i-message-my-cleaner) for how chat works.

## What if I raised it by mistake?
Choose **I raised this by mistake** within 15 minutes of sending the alert. The team is told, but the booking stays on hold until Mundoria clears it.

## When should I not use it?
A Safety alert is for safety only. It is not the way to report lateness, missed areas or breakage. For those, use **Report issue** on the same booking instead:
- Lateness or a missed visit: [What if my cleaner is late or doesn't turn up?](/help/article/cleaner-late-or-no-show)
- Cleaning quality: [What can I do if I'm not happy with my clean?](/help/article/not-satisfied)
- Damage or missing items: [How do I report damage or a missing item?](/help/article/report-a-claim)

If a safety concern comes up outside a live visit, contact the team from the [Contact us](/contact) page and explain what happened. Where something may be criminal, contact the police as well.

> Tip: Keep your phone charged and nearby on the day of a visit, so you can call 999 or alert Mundoria quickly.

More answers are in the [Safety & Trust FAQ](/faq/safety).`,
    collection_id: C[0].id,
    slug: "safety-alert",
    sort_order: 275,
    summary: "Use Safety alert on your booking if you feel unsafe during a live visit. Call 999 first if you or anyone else is in immediate danger.",
    title: "How do I raise a Safety alert during a visit?",
    topic: "Booking issues",
  },
  {
    body: `You can cancel from the booking page in your Mundoria account, up to the start time, as long as the clean has not started. Cancelling 24 hours or more before the start time is free, and within 24 hours the full booking price is charged.

## How do I cancel?
1. Go to [your bookings](/bookings) and open the visit.
2. Under **Need help?**, choose **Cancel booking**.
3. Read the message that shows whether the cancellation is free or charged.
4. Write a short reason. A reason is required before you can continue.
5. Choose **Confirm cancellation**.

You will see a confirmation, and your cleaner is told the visit is off.

## What does it cost?
| When you cancel | What you pay |
| --- | --- |
| 24 hours or more before the start time | Nothing |
| Less than 24 hours before the start time | The full booking price |

The same rule is shown before you book and again when you cancel. Within 24 hours, your cleaner has set that time aside and has usually turned down other work. Your statutory consumer rights are not affected.

## What happens to my payment?
Your card is saved when you book, and nothing is charged at that point. From 48 hours before the visit, once a cleaner is assigned, a temporary hold is placed on your card. If you cancel for free, any hold is released. If you cancel within 24 hours, the full price is taken from the hold or your saved card. See [payment and cancellation](/help/article/payment-and-cancellation) for the full timeline.

If a booking is cancelled because the hold could not be placed by 24 hours before the visit, no cancellation fee applies.

## Can I cancel one visit of a regular clean?
Yes. On a regular clean, the cancel window asks you to choose **This visit only** or **This visit and all future visits**. There is no minimum term, and each visit follows the same 24-hour rule. You can also pause visits for a holiday, as explained in [How do recurring cleans work?](/help/article/recurring-cleans).

## Would moving the date be better?
If you only need a different day or time, you can move the visit yourself while it is 24 hours or more away. See [Can I change the date, time or details of a booking?](/help/article/modify-booking). Within 24 hours a visit cannot be moved, so you would need to cancel and book again.

## Why can't I see the cancel option?
Once the clean has started or the start time has passed, the visit can no longer be cancelled online. Completed and already cancelled visits cannot be cancelled either. If something went wrong with a visit, use **Report issue** on the booking, or contact the team from the [Contact us](/contact) page.

More answers are in the [Cancellations & Changes FAQ](/faq/cancellations).`,
    collection_id: C[0].id,
    slug: "how-do-i-cancel",
    sort_order: 310,
    summary: "Cancel from the booking page in your account. It is free 24 hours or more before the start time, and the full price is charged within 24 hours.",
    title: "How do I cancel my booking?",
    topic: "Booking issues",
  },
  {
    body: `You can move a visit to a new date or time yourself, free of charge, while it is 24 hours or more away. Other details, such as the hours, service, extras or address, cannot be edited online after booking, so contact the team or book again.

## How do I change the date or time?
1. Open the visit from [your bookings](/bookings).
2. In the **Manage** panel, choose **Change date & time**.
3. Pick the new date and arrival time, then save.

You will see a confirmation once the change is saved.

## What happens to my cleaner?
Moving a visit sends it back to matching for the new time. Your cleaner is offered it again if they are free and still suitable. If not, Mundoria matches another suitable cleaner and tells you once they accept. Until then, the booking shows that Mundoria is looking for a cleaner.

If keeping the same person matters more than the time, ask your cleaner about their availability first. See [How do I message my cleaner?](/help/article/how-do-i-message-my-cleaner).

## Why can't I see Change date & time?
- The visit is less than 24 hours away. It cannot be moved within 24 hours, so you would need to cancel and book again. Cancelling within 24 hours costs the full booking price, as explained in [How do I cancel my booking?](/help/article/how-do-i-cancel).
- The clean has already started, or the visit is completed or cancelled.

## Can I change the hours, service or extras?
There is no self-serve option to change the hours, service, extras or address on an existing booking. These changes can affect the price and which cleaners are suitable. You have two options:
- Contact the team from the [Contact us](/contact) page and explain what you need.
- Cancel 24 hours or more ahead, which is free, and make a new booking with the right details.

## Can I update access notes or instructions?
Notes added at checkout cannot be edited later. Once your cleaner has accepted, message them with a new key safe code, parking detail or priority. Before a cleaner accepts, contact the team instead.

## Can I change who cleans for me?
On an upcoming visit with a cleaner assigned, the **Manage** panel can include an option to change your cleaner. Mundoria then starts a new search and leaves your previous cleaner out of it. On a regular clean, this option is available from the second visit, and the remaining visits are cancelled while Mundoria searches again. See [Can I choose my cleaner on Mundoria?](/help/article/can-i-choose-my-cleaner).

## Does changing a booking affect payment?
Moving a visit 24 hours or more ahead is free. Your saved card stays on the booking, and the usual payment hold and next-day payment apply to the new date.

More answers are in the [Cancellations & Changes FAQ](/faq/cancellations).`,
    collection_id: C[0].id,
    slug: "modify-booking",
    sort_order: 320,
    summary: "Move a visit yourself with Change date & time while it is 24 hours or more away. Hours, service, extras and address changes go through support.",
    title: "Can I change the date, time or details of a booking?",
    topic: "Booking issues",
  },
  {
    body: `You can message your cleaner in your Mundoria account as soon as they accept your booking. Open the booking and choose **Message cleaner**, or go to **Messages** to see all your conversations.

## When does messaging open?
Chat opens once a cleaner has accepted your booking. Before that, the booking shows that Mundoria is looking for a cleaner or waiting for confirmation, so there is no one to message yet. The conversation stays available after the clean, which helps with any follow-up questions.

## Where do I find the chat?
1. Open the visit from [your bookings](/bookings), then choose **Message cleaner**.
2. Or go to [Messages](/messages), where each booking with a cleaner has its own conversation.
3. Type your message and send it.

Each conversation shows your cleaner's first name, the service and the date of the visit.

## What can I send?
- Text messages about access, parking, timing and priorities.
- Up to four photos or short videos in one message, for example of a key safe or a stubborn mark.

Your cleaner is notified of new messages in the app and by email, depending on their settings. You are notified in the same way when they reply.

## What is chat useful for?
Chat is a simple way to share updates after booking. Notes added at checkout cannot be edited later, so use chat for a new key safe code, a parking change or a room to skip. For more ideas, see [How should I prepare for a cleaning visit?](/help/article/prepare-for-a-clean).

## What should I keep off chat?
- Payment. Every payment stays on Mundoria, never cash or a private transfer to your cleaner.
- Private arrangements to book cleaning outside Mundoria.
- Anything urgent about your safety during a visit. Use a [Safety alert](/help/article/safety-alert) for that, and call 999 if anyone is in danger.

If a Safety alert is under review, a notice appears at the top of the chat. Keep messages respectful, as Mundoria can see that thread.

## What if my cleaner does not reply?
Cleaners may be driving or in the middle of a clean, so allow a little time. If the visit is close and you are worried about timing, see [What if my cleaner is late or doesn't turn up?](/help/article/cleaner-late-or-no-show). For anything else, contact the team from the [Contact us](/contact) page.

> Tip: Put the most important detail, such as a door code, in the first line of your message.`,
    collection_id: C[0].id,
    slug: "how-do-i-message-my-cleaner",
    sort_order: 330,
    summary: "Message your cleaner from the booking page or from Messages once they accept your booking. Chat stays on Mundoria and supports photos.",
    title: "How do I message my cleaner?",
    topic: "Booking issues",
  },
  {
    body: `If your cleaner is running late, message them from your booking and follow their arrival on the booking page. If they have not checked in about 30 minutes after the start time, Mundoria treats the visit as a no-show and looks for a replacement.

## How can I see where my cleaner is?
Open the visit from [your bookings](/bookings). Once your cleaner sets off, the booking shows them as en route and can show their position on a map. When they arrive and check in, a notice confirms that cleaning has started.

## What should I do if they are running late?
1. Choose **Message cleaner** on the booking and ask for an update. See [How do I message my cleaner?](/help/article/how-do-i-message-my-cleaner).
2. Allow a few minutes. Small delays from traffic or an earlier job can happen.
3. If the delay is long or affects the clean, use **Report issue** on the booking and choose **Timing or attendance issue**.

## What happens if my cleaner does not turn up?
Mundoria checks regularly for visits where the cleaner has not checked in. About 30 minutes after the start time, the visit is marked as a no-show. You get a notification that Mundoria is matching another cleaner.
- Mundoria searches for another suitable cleaner for up to one hour.
- If someone accepts, their details appear on your booking.
- If no one can take the visit within that hour, the booking is cancelled and any payment is refunded.

You are not charged for a clean that did not happen. A missed visit also counts against the cleaner's reliability, which affects their future matching.

## Does Mundoria check before the day?
Yes. Your cleaner is asked to confirm they are still coming at set points in the day before the visit. If they cannot make it, Mundoria offers the visit to backup cleaners. Your booking may show that it is protected, which means backups are ready if anything changes.

## What if they left early or I am still unhappy?
Use **Report issue** and choose the closest option, such as **Cleaner left too early**. The team reviews the booking on its facts. For problems with the cleaning itself, see [What can I do if I'm not happy with my clean?](/help/article/not-satisfied).

## What if I am the one running late?
If you are letting the cleaner in yourself, message them as soon as you can. After a 5-minute grace period on arrival, a waiting charge can apply while access is sorted out.

Please do not arrange another cleaner outside Mundoria while a visit is still open. If you ever feel unsafe, use a [Safety alert](/help/article/safety-alert). More answers are in the [Cancellations & Changes FAQ](/faq/cancellations).`,
    collection_id: C[0].id,
    slug: "cleaner-late-or-no-show",
    sort_order: 340,
    summary: "Message your cleaner first. If they have not checked in about 30 minutes after the start time, Mundoria starts looking for a replacement.",
    title: "What if my cleaner is late or doesn't turn up?",
    topic: "Booking issues",
  },
  {
    body: `If something was missed or not done well, tell Mundoria through your booking as soon as you can, ideally within 48 hours. Use the completion checklist and **Report issue**, and the team reviews what happened on its facts.

## How do I report it?
1. Open the visit from [your bookings](/bookings).
2. If you see **Confirm completed checklist**, untick anything that was not done and say why.
3. In the **Manage** panel, choose **Report issue**, then **Cleaning quality issue**.
4. Pick the closest option, such as a missed area or work done to a poor standard.
5. Add any details, then choose **Submit to admin**.

You will see a confirmation that the issue was reported, and the team will get back to you.

## Should I send photos?
Where they help, yes. Photos make missed areas or marks easier to understand. The Report issue form takes text only, so send photos through the support chat. Choose **Contact us** on the [Contact us](/contact) page or in the Help Centre, then attach them with your booking reference.

## What happens next?
The team looks at what you booked, the time available, your instructions, the checklist and the messages on the booking. Sometimes there is a simple explanation, such as an access problem or the booked time running out. Each case is reviewed on its facts, and the team explains the next step.

The outcome depends on what happened, so Mundoria does not promise a set result for every report. Your statutory consumer rights are not affected.

## Should I still leave a rating?
Yes, an honest rating helps. Once the booking is completed, choose **Leave a rating** on the booking. Mundoria uses ratings internally for fair medallion scoring. See [rating and reviewing a clean](/help/article/rate-and-review).

## What if something was damaged or is missing?
Damage and missing items follow a slightly different route. See [How do I report damage or a missing item?](/help/article/report-a-claim).

## Can I have a different cleaner next time?
Yes. When you book again, choose **Match someone new** instead of your previous cleaner. If you were happy apart from one issue, you can keep them, as explained in [Can I book the same cleaner again?](/help/article/rebook-same-cleaner).

## How can I avoid it next time?
Many problems come from unclear priorities or too little time. Mark the rooms that matter most when you book, and add a note about anything specific. If the home regularly needs more time, book more hours on your next visit.

> Tip: Take photos before you tidy or re-clean an area yourself, so the team can see what you saw.

More answers are in the [Problems During or After a Clean FAQ](/faq/problems).`,
    collection_id: C[0].id,
    slug: "not-satisfied",
    sort_order: 350,
    summary: "Untick missed items on the completion checklist, use Report issue on the booking, and send photos to the team as soon as you can.",
    title: "What can I do if I'm not happy with my clean?",
    topic: "Booking issues",
  },
  {
    body: `Report damage or a missing item through **Report issue** on the booking as soon as you notice, ideally within 48 hours. The team reviews each report on its facts, and compensation is not automatic.

## How do I report it?
1. Open the visit from [your bookings](/bookings).
2. In the **Manage** panel, choose **Report issue**.
3. Choose **Damage or property issue**.
4. Pick **An item was damaged**, **An item is missing** or another option.
5. Describe what happened and when you noticed, then choose **Submit to admin**.

## What should I include?
- What was affected, and where it was in the property.
- When you last saw it intact, or last saw it at all.
- Whether the item or surface was part of the agreed clean.
- Photos where they help. Send these through the support chat from the [Contact us](/contact) page, with your booking reference.

Where it is safe to do so, leave a damaged item as it is until the team has reviewed it.

## What if something is missing?
First, look nearby in case it was moved temporarily during cleaning. If you still cannot find it, report it straight away with as much detail as you can. Where you suspect a crime, contact the police as well.

## What happens next?
Mundoria reviews the booking with your cleaner and looks at the information from both sides. The issue is handled through Mundoria's dispute and insurance process, and the team explains the next steps.

## Is damage covered by insurance?
Every cleaner must hold at least £1 million of Public Liability insurance before they can take bookings. This is an onboarding requirement for cleaners, not a Mundoria policy that covers you. Whether a claim is covered depends on the policy wording, its exclusions and what actually happened. Public Liability does not automatically cover every item, damage from a treatment you asked for, lost keys or work you are unhappy with. See [Who are Mundoria cleaners and how are they checked?](/help/article/who-are-mundoria-cleaners) for the full checks.

Your statutory consumer rights are not affected.

## What if a key is lost?
Tell the team immediately, as a lost key can be a security risk. Take any urgent steps you need, such as changing a key safe code or the locks.

## What if it is a quality problem rather than damage?
Missed areas and poor standards follow the steps in [What can I do if I'm not happy with my clean?](/help/article/not-satisfied).

## What if I feel unsafe?
Damage reports are not for emergencies. If you feel unsafe during a visit, use a [Safety alert](/help/article/safety-alert), and call 999 if anyone is in danger.

More answers are in the [Problems During or After a Clean FAQ](/faq/problems).`,
    collection_id: C[0].id,
    slug: "report-a-claim",
    sort_order: 360,
    summary: "Use Report issue on the booking and choose Damage or property issue. Send photos to the team and report it as soon as you notice.",
    title: "How do I report damage or a missing item?",
    topic: "Booking issues",
  },
  {
    body: `Mundoria cleaners are independent cleaning professionals who use Mundoria to find suitable bookings. Before they can take a job, they pass identity checks, a Basic DBS check and right-to-work checks where applicable, show their insurance and pass an interview.

## Are they employed by Mundoria?
No. Cleaners work independently and decide which bookings to accept. Mundoria organises the matching, booking details, payment and support around each visit. Signing up does not make someone available to customers, because they must be approved first.

## What checks do cleaners pass?
- Identity verification.
- A Basic DBS check where applicable, reviewed before their profile is fully activated.
- Right-to-work checks where applicable.
- At least £1 million of Public Liability insurance, with the certificate, amount and expiry date checked.
- A review of their cleaning experience and the services they want to offer.
- UTR details where relevant to self-employment.
- An interview with the Mundoria team, which they must pass before approval.

The interview covers service standards, conduct, customer privacy, safety and how a booking should be handled. It is Mundoria's own induction, not an external qualification.

## Do checks continue after approval?
Yes. Cleaners are reminded before their insurance runs out. Anyone whose cover expires is removed from matching until they upload a renewed certificate. Reliability matters too, because cancellations and no-shows affect future matching.

## How is a cleaner chosen for my booking?
Mundoria matches on the service you booked, your postcode, availability, reliability, distance and medallion level. Some services need a higher medallion level. Your booking is a request until a cleaner accepts it. You can then see their name, photo and medallion on the booking. See [Can I choose my cleaner on Mundoria?](/help/article/can-i-choose-my-cleaner).

## Is any check a guarantee?
No vetting process removes every risk, and no honest platform can promise that. Sensible precautions still help, such as putting valuables away before a visit, as covered in [How should I prepare for a cleaning visit?](/help/article/prepare-for-a-clean). If something does go wrong, there is a clear route to report it, explained in [How do I report damage or a missing item?](/help/article/report-a-claim).

## Does insurance cover me?
Insurance is a requirement for cleaners, not a Mundoria policy covering you. Whether a particular claim is covered depends on the cleaner's policy wording, its exclusions and what happened.

## How do payments stay safe?
Every payment goes through Mundoria using Stripe. Cleaners never receive your card details, and you should never pay a cleaner in cash.

Read more in the [Cleaning Professionals FAQ](/faq/professionals) or on the [How it works](/how-it-works) page.`,
    collection_id: C[0].id,
    slug: "who-are-mundoria-cleaners",
    sort_order: 410,
    summary: "Mundoria cleaners are independent cleaners who pass identity, DBS, right-to-work and insurance checks and an interview before approval.",
    title: "Who are Mundoria cleaners and how are they checked?",
    topic: "Services & cleaners",
  },
  {
    body: `For a first booking, Mundoria matches a suitable cleaner for you rather than asking you to pick from a list. Once a cleaner has completed a visit for you, you can ask for them again on later bookings, and Mundoria tries them first.

## How does Mundoria pick a cleaner?
Matching looks at the service you booked, your postcode, availability, reliability, travel distance and medallion level. The cleaner then accepts or declines the request. Once they accept, you see their name, photo and medallion on the booking.

## Can I request someone I have had before?
Yes. When you book while signed in, a step called **Request a cleaner you already know?** lists cleaners who have completed a visit for you. Choose **Continue with** and their name, or choose **Match someone new**. You can also choose **Book this cleaner again** on a past booking. See [Can I book the same cleaner again?](/help/article/rebook-same-cleaner).

Your choice is tried first, but it is not guaranteed. If they are busy or cannot take that time, Mundoria matches someone else who is suitable.

## Can I browse cleaners before booking?
You can view public cleaner profiles in the [Birmingham cleaner directory](/cleaners/birmingham). For a new booking, Mundoria still matches the cleaner, so viewing a profile does not reserve that person. Requesting a named cleaner works for cleaners who have already cleaned for you.

## Can I ask for a different cleaner?
Yes. On an upcoming visit with a cleaner assigned, the **Manage** panel can show an option to change your cleaner. Mundoria then starts a new search and leaves your previous cleaner out of it. On a regular clean, this option is available from the second visit. See [Can I change the date, time or details of a booking?](/help/article/modify-booking).

For future bookings, simply choose **Match someone new**. If a specific problem led to the change, tell the team through **Report issue** so it can be reviewed properly.

## Can I ask for a female or male cleaner?
You can add a preference in the **Any specific requirements?** box at checkout. It is a note on the booking rather than a matching filter, so it cannot be guaranteed. If it matters a lot, mention it clearly and check the cleaner's name once they accept.

## What do I see before the visit?
After a cleaner accepts, their name, photo and medallion level appear on your booking. You can then message them about access and priorities.

## Who are the cleaners?
Every cleaner passes identity, DBS and insurance checks and an interview before approval. See [Who are Mundoria cleaners and how are they checked?](/help/article/who-are-mundoria-cleaners) and the [Matching FAQ](/faq/matching).`,
    collection_id: C[0].id,
    slug: "can-i-choose-my-cleaner",
    sort_order: 420,
    summary: "Mundoria matches a suitable cleaner for each new booking. You can request a cleaner who has already cleaned for you, or ask for someone new.",
    title: "Can I choose my cleaner on Mundoria?",
    topic: "Services & cleaners",
  },
  {
    body: `Yes. Choose **Book this cleaner again** on a past booking, or pick them in the booking flow if they have cleaned for you before. Mundoria offers your visit to them first and matches someone else if they are not free.

## How do I rebook the same cleaner?
1. Open a past visit from [your bookings](/bookings).
2. In the **Your cleaner** panel, choose **Book this cleaner again**.
3. Check the details carried over from that booking, such as the address, service and notes.
4. Pick a new date and time, then complete checkout.

You can also open the **Completed** tab in your bookings and choose **Rebook**. The booking flow then asks **Request a cleaner you already know?**, where you can choose **Continue with** and their name.

## Which cleaners can I request?
Any cleaner who has completed a visit for you. Cleaners who have worked at the address you are booking appear first, with their number of completed visits. If you would rather have someone else, choose **Match someone new**.

## Is my cleaner guaranteed?
No. Cleaners are independent and set their own availability. Your choice is tried first, but if they are busy, away or cannot take that time, Mundoria matches another suitable cleaner. You see who accepted on your booking page.

## How can I keep the same cleaner on a regular clean?
Book a regular clean and choose your cleaner in the booking flow. When you ask for the same cleaner on a regular clean, later visits are offered first to the cleaner who takes the first one. When they are away, Mundoria looks for a replacement. See [How do recurring cleans work?](/help/article/recurring-cleans).

## What gets carried over?
The address, service, cleaning standard, hours, priority areas, frequency and your notes are copied from the earlier booking. Check them before you confirm, especially access notes and key safe codes. Extras and the date and time are chosen again.

## Does rebooking change payment or cancellation?
No. A rebooked visit is a new booking. Your card is saved with no charge, a hold is placed from 48 hours before once a cleaner is assigned, and payment is taken the day after the clean. Cancelling is free 24 hours or more ahead, and the full price is charged within 24 hours.

## What if I have never booked before?
Start at [Book a clean](/booking/new) and Mundoria will match a suitable cleaner for you. For a step-by-step guide, see [how to book a clean](/help/article/how-do-i-book). For more on choosing who cleans, see [Can I choose my cleaner on Mundoria?](/help/article/can-i-choose-my-cleaner).

> Tip: If a cleaner suits you well, set up a regular clean so it is easier to keep them.`,
    collection_id: C[0].id,
    slug: "rebook-same-cleaner",
    sort_order: 430,
    summary: "Yes. Choose Book this cleaner again on a past booking, or pick them when you book. Mundoria tries them first, but it cannot be guaranteed.",
    title: "Can I book the same cleaner again?",
    topic: "Services & cleaners",
  },
  {
    body: `You do not need to clean before your cleaner arrives. Share clear access details, pets and priorities when you book, clear the surfaces you want cleaned, and put valuables away.

## What should I tell Mundoria when I book?
- Pets: the booking flow asks whether you have pets. See [pets when booking](/help/article/pets-when-booking).
- Access: how your cleaner gets in, such as a key safe, concierge or who will be home.
- Parking: where your cleaner can park, and any permits or codes.
- Priorities: the rooms that matter most this time.
- Anything to avoid: rooms not to enter, delicate surfaces and products not to use.

Add these in the **Any specific requirements?** box at checkout. Notes cannot be edited after booking, so message your cleaner once they accept if anything changes. See [How do I message my cleaner?](/help/article/how-do-i-message-my-cleaner).

## Do I need to provide products and equipment?
Your estimate covers labour for the session. You can use your own products and equipment, or add the Mundoria products or equipment as extras when you book. If you supply them, leave them somewhere easy to find. If fragrance-free or allergy-friendly products matter, say so in your notes.

## What should I do before the visit?
1. Clear worktops, floors and surfaces you want cleaned, so the time goes on cleaning.
2. Put away cash, jewellery, important documents and medication.
3. Secure any pets that are nervous or may run out of an open door.
4. Check that the key safe code or access arrangement still works.
5. Keep your phone nearby in case your cleaner messages you.

Light items can be moved to clean around them. Heavy furniture is not moved unless that was agreed before the booking.

## Do I need to be at home?
No. Some customers stay in and others leave clear access instructions. If you are letting your cleaner in, be there on time. After a 5-minute grace period on arrival, a waiting charge can apply while access is sorted out. If you work from home, mention the room you will use so noisy tasks can be planned around it.

## Will the cleaner tidy or organise?
Cleaning is the focus. A cleaner may move small items to clean a surface, but sorting belongings or reorganising cupboards is different work. Mention anything specific in your notes.

## What if someone needs extra care?
If someone in the home is pregnant, recovering or has reduced mobility, [recovery cleaning](/help/article/recovery-cleans) includes a step for priority areas and product preferences.

> Tip: Write your access notes as if your cleaner has never seen the building before.

More answers are in the [Preparing for a Clean FAQ](/faq/preparing) and the [Access & Keys FAQ](/faq/access).`,
    collection_id: C[0].id,
    slug: "prepare-for-a-clean",
    sort_order: 440,
    summary: "Share access, pets and priorities when you book, clear key surfaces, put valuables away and decide on products before your cleaner arrives.",
    title: "How should I prepare for a cleaning visit?",
    topic: "Services & cleaners",
  },
  {
    body: `A recurring clean repeats your booking weekly, fortnightly or monthly, with the same details each time. There is no subscription or minimum term, and each visit follows the same payment and 24-hour cancellation rules as a one-off booking.

## How do I set one up?
1. Start at [Book a clean](/booking/new) and choose your service.
2. At **How often do you want your session to happen?**, choose **Once a week**, **Once a fortnight** or **Once a month**.
3. Pick the first date and arrival time, then complete checkout.

House cleaning lets you choose one-off, weekly, fortnightly or monthly visits. Workspace cleaning and short-let turnovers are always booked on a repeat schedule. Some recovery cleaning services can repeat too.

## How are visits and payments handled?
Each visit appears as its own booking in [your bookings](/bookings), and the next visit is added ahead of time. Your saved card is used for each one. From 48 hours before each visit, once a cleaner is assigned, a temporary hold is placed. Payment is taken the day after that clean. See [Why do I pay in advance?](/help/article/why-pay-in-advance).

## Will I have the same cleaner every time?
Mundoria tries to keep continuity, but it cannot be guaranteed. If you request a cleaner you already know when booking, later visits are offered first to the cleaner who takes the first one. When they are away, Mundoria looks for a suitable replacement. See [Can I book the same cleaner again?](/help/article/rebook-same-cleaner).

## How do I skip, pause or stop visits?
- Skip one visit: open it, choose **Cancel booking**, then **This visit only**.
- Pause for a holiday: open an upcoming visit, choose **Pause for a holiday** and pick the first and last day you are away. Visits in between are skipped, then the regular clean carries on by itself.
- Stop the schedule: choose **Cancel booking**, then **This visit and all future visits**.

Each visit is free to cancel 24 hours or more before its start time, and the full price applies within 24 hours. See [How do I cancel my booking?](/help/article/how-do-i-cancel).

## Can I change the day, time or hours?
You can move a single visit with **Change date & time** while it is 24 hours or more away. To change the regular day, the frequency or the hours, contact the team from the [Contact us](/contact) page.

## Do my preferences carry over?
Yes. Your address, service, hours, priority areas and notes are copied to each new visit. If something changes, such as a key safe code, message your cleaner once they accept.

## Can recovery cleaning become regular?
Yes. You can switch from [recovery cleaning](/help/article/recovery-cleans) to a regular house clean whenever it becomes the better fit.

More answers are in the [Recurring Bookings FAQ](/faq/recurring).`,
    collection_id: C[0].id,
    slug: "recurring-cleans",
    sort_order: 450,
    summary: "Choose weekly, fortnightly or monthly visits when you book. Each visit is its own booking, with no minimum term and the usual 24-hour rule.",
    title: "How do recurring cleans work?",
    topic: "Services & cleaners",
  },
  {
    body: `Recovery cleaning is house cleaning arranged around a harder time, such as pregnancy, illness, injury, a hospital stay or a bereavement. It is still cleaning, and Mundoria does not provide medical, nursing or personal care.

## Which services can I book?
Choose **Recovery cleaning** when you start a booking, then pick the service that fits:
- **Pregnancy & postpartum cleaning**, during pregnancy and in the weeks after birth.
- **Illness & injury recovery**, while recovering from illness, injury or limited mobility.
- **Hospital Discharge Home Cleaning**, a comprehensive clean before or after someone comes home from hospital.
- **Bereavement Support Cleaning**, respectful, practical cleaning after a loss.

You can read about each one on the [recovery cleaning page](/cleaning/recovery).

## What is different about the booking?
Recovery bookings include a **Recovery preferences** step. You can:
- Choose priority areas, such as the kitchen, bathrooms, bedrooms, living areas, hallways or laundry area.
- Say whether the home is easy to move around, needs extra care, or needs a bigger first clean.
- Add notes on products and fragrance, such as fragrance-free only or no bleach, and any doors to keep closed.

Use these notes to mention rest times, noise, a new baby or mobility equipment, so the clean can work around the household.

## What does recovery cleaning not include?
- Personal care, such as help with washing, dressing or feeding.
- Medication, or any medical, nursing or clinical tasks.
- Clinical, medical-grade or biohazard cleaning.
- Physical help or mobility support for the person.
- Counselling or emotional-support services.

## Can someone book it for me?
Yes. A partner, relative or friend can book on your behalf. They need accurate details about the property and access. Where appropriate, the person living there should know about the booking and be comfortable with it. A clean can also be arranged before someone comes home, if access can be arranged safely.

## Can it repeat?
Pregnancy & postpartum, illness & injury and bereavement cleans can be one-off or repeat weekly, fortnightly or monthly. Hospital discharge cleans are booked as single visits. See [How do recurring cleans work?](/help/article/recurring-cleans). When life settles, you can move to a regular house clean.

## Who will clean?
Your cleaner is an independent professional who has passed Mundoria's checks and interview. See [Who are Mundoria cleaners and how are they checked?](/help/article/who-are-mundoria-cleaners). For practical tips before the visit, see [How should I prepare for a cleaning visit?](/help/article/prepare-for-a-clean).

> Tip: If fragrance or a particular product matters, you can also leave out your own products for the cleaner to use.

More answers are in the [Recovery Cleaning FAQ](/faq/recovery).`,
    collection_id: C[0].id,
    slug: "recovery-cleans",
    sort_order: 460,
    summary: "Recovery cleaning is house cleaning arranged around pregnancy, illness, injury, hospital discharge or bereavement. It is cleaning, not care.",
    title: "What is recovery cleaning?",
    topic: "Services & cleaners",
  },
  {
    body: `To become a Mundoria cleaner, create a cleaner account and complete the onboarding application in your dashboard. You also book and pass a short online interview, and you can take jobs once Mundoria approves your account.

## Who can apply?
Mundoria works with independent, self-employed cleaners rather than employees. You must be at least 18 and have the right to work in the UK. You need to register as self-employed with HMRC and hold Public Liability insurance of at least £1 million. The full terms are in the [Self-Employed Cleaner Agreement](/legal/cleaner-agreement).

## How do I apply?
1. Create your account on the [cleaner sign-up page](/signup/cleaner) and add your mobile number when asked.
2. Open your dashboard. The onboarding application appears there until you submit it.
3. Work through each step. Each one shows roughly how many minutes it takes.
4. Accept the agreements, confirm your details are accurate and submit.
5. Note the application reference on the confirmation screen, as it helps if you contact us.

Your answers are saved as a draft on the device you use, so you can stop and come back later.

## What does the application cover?
The steps sit in three groups:
- **About your work:** your cleaning experience, profile photo, services, working hours and the areas you cover.
- **Checks and readiness:** photo ID, your UTR, a Basic DBS check, insurance, your equipment and a short quiz.
- **Finish:** location consent, your interview booking, an emergency contact and the agreements.

The quiz has 12 questions about how Mundoria jobs work and basic cleaning practice. You need at least 9 correct answers to pass. You also tick the three charter promises about honouring jobs, following the brief and keeping payments on Mundoria. The documents are explained in [What documents do I need?](/help/article/cleaner-documents).

## What is the interview?
It is a 30-minute online interview with the Mundoria team. You choose a weekday slot at 9am, 11am, 1pm, 2pm or 3pm UK time. It covers service standards, conduct, customer privacy and safety, and you must pass it before approval.

## What happens after I submit?
Mundoria reviews your documents and holds your interview. You can explore your dashboard meanwhile, but job offers only appear after approval. [How long does approval take?](/help/article/how-long-approval) explains each stage.

Once approved, you set up payouts with Stripe from your dashboard. Approval does not guarantee a set number of jobs. Offers depend on customer demand, your [services and areas](/help/article/services-and-areas), your hours and your reliability.

> Tip: Read the cleaner questions in our [FAQ on cleaning professionals](/faq/professionals) before you start, so you know what the checks involve.`,
    collection_id: C[1].id,
    slug: "how-do-i-partner",
    sort_order: 10,
    summary: "Create a cleaner account, complete the onboarding application, pass a short online interview and wait for approval before job offers appear.",
    title: "How do I become a Mundoria cleaner?",
    topic: "Getting started",
  },
  {
    body: `To join Mundoria you need government-issued photo ID, a clear profile photo, your UTR with proof from HMRC, a Basic DBS certificate and a Public Liability insurance certificate. Your insurance must give at least £1 million of cover, and Mundoria checks every document before approving your account.

## What exactly do I upload?
| Document | What Mundoria asks for |
| --- | --- |
| Photo ID | A passport photo page, or the front and back of a driving licence or BRP. A national ID card works if it shows your photo and full name. |
| Profile photo | Your face and shoulders, looking at the camera. No sunglasses and no group photos. JPEG, PNG or WebP. |
| UTR | Your 10-digit UTR and a document showing your name and UTR, such as an HMRC letter or a screenshot of your HMRC account. |
| Basic DBS | Your certificate number, the issue date and at least one page of the certificate. |
| Insurance | Provider, policy number, the name on the policy, cover amount, expiry date and the certificate itself. |

For insurance, you also confirm that the policy covers professional cleaning work. The expiry date must be today or later.

## How do I make sure documents are accepted?
- Lay the document flat and photograph the whole page.
- Do not crop the corners or cover any part with your fingers.
- Avoid glare and shadows, so every word is readable.
- Check the name matches the name on your Mundoria account.

Very small files are flagged as possibly unreadable, so use a clear, full-size photo or scan.

## What if I do not have a document yet?
You can still work through the rest of the application while you arrange it:
- **UTR:** register for Self Assessment with HMRC. HMRC normally posts your UTR around 15 days after you register. Mundoria cannot approve your account without a UTR.
- **DBS:** you can apply for a Basic DBS check through GOV.UK. Your profile is not activated until your certificate has been reviewed.
- **Insurance:** arrange cover that meets the minimum. Mundoria must verify it before activation.

After you submit, the confirmation screen lists anything still outstanding. [Contact Mundoria](/help/article/contact-mundoria-cleaner) when it is ready, and the team will tell you how to send it.

## Do my documents expire?
Insurance is tracked after approval. Mundoria reminds you 30, 14 and 7 days before your policy expires, in the app and by email. If it lapses, you stop receiving new offers until a renewed certificate has been checked.

You must also tell Mundoria promptly if your circumstances change, as set out in the [cleaner agreement](/legal/cleaner-agreement). Mundoria may repeat checks at any time.

Next, see [how to apply](/help/article/how-do-i-partner) or [how long approval takes](/help/article/how-long-approval).`,
    collection_id: C[1].id,
    slug: "cleaner-documents",
    sort_order: 20,
    summary: "You need photo ID, a profile photo, your UTR with HMRC proof, a Basic DBS certificate and Public Liability insurance of at least £1 million.",
    title: "What documents do I need to join Mundoria?",
    topic: "Getting started",
  },
  {
    body: `You choose your services and work areas in the onboarding application, and you can change them later on your profile page. Mundoria only offers you jobs for services you have selected, in places your home base, working radius and extra districts cover.

## How do I choose services?
Only select services you have the experience and confidence to carry out. The main categories are house cleaning, moving home, Airbnb and short-let cleaning, workspace cleaning and recovery cleaning. Each category contains services such as regular, deep, end of tenancy or office cleaning.

Selecting a service does not mean you will be offered every booking of that type:
- Some services need a Silver or Gold medallion before they are offered to you.
- If Mundoria flags your account for a specialist review, specialist work such as end of tenancy and recovery cleaning waits until that review is approved.
- If a booking needs you to bring products or equipment and you have none, you rank lower for it.

The medallion each service needs is listed in [How can I receive more job offers?](/help/article/get-more-jobs).

## How do I set my areas?
In onboarding, you pick the Birmingham district you usually start from. That becomes your home base and the centre of your map. You can add up to 6 districts in total from the same list.

You then set a working radius of up to 15 miles from your home base. Jobs outside that circle are not offered unless they fall in an extra district you added. Choose a radius you will reliably travel, not the furthest you could manage on a good day.

## Does how I travel matter?
Yes. Onboarding asks how you usually get to jobs: car, public transport, bicycle, walking or something else. If you only walk or cycle, jobs more than about 5 miles away rank you lower. You also say whether you can carry cleaning equipment with you.

## How do I change my services or areas later?
1. Open your [profile](/cleaner/profile).
2. Under **Services you offer**, tick or untick each service.
3. Under **Where you work**, set your working radius in miles, up to 15.
4. Add a postcode area, such as B15, and tap the plus button. Tap an area to remove it.
5. Tap **Save profile**.

Changes apply to new offers. Jobs you have already accepted stay in place.

## Why does accuracy matter?
Covering areas you cannot reach on time leads to late arrivals and cancellations. Cancellations lower your reliability and reduce future offers. Keep your hours accurate as well, using [How do I set my availability?](/help/article/set-availability).

If you are still applying, see [how to become a Mundoria cleaner](/help/article/how-do-i-partner).`,
    collection_id: C[1].id,
    slug: "services-and-areas",
    sort_order: 30,
    summary: "Pick the services you can deliver and set a home base, working radius and extra districts. You can change services and areas later on your profile.",
    title: "How do I choose my services and work areas?",
    topic: "Getting started",
  },
  {
    body: `You set your regular working days and hours in the onboarding application, and you can turn days on or off later on your profile. For holidays and appointments, use **Take time off** in your Diary so Mundoria stops offering you visits on those days.

## How do I set my hours during onboarding?
1. Choose each day you are usually available.
2. Set a start and end time for each day, between 7am and 11pm.
3. Add a second time window if you have a break, such as a school run. It must start after the first window ends.
4. Choose how many hours a week you would prefer to work: up to 10, 10 to 20, 20 to 30, 30 or more, or flexible.

Your preferred weekly hours guide matching. They are not a hard cap on offers.

## How does matching use my hours?
The whole visit has to fit inside your hours for that day. For example, a three-hour clean starting at 4pm needs you to be available until at least 7pm. You are also skipped for any booking that overlaps another Mundoria visit you already have.

## How do I change my working days later?
1. Open your [profile](/cleaner/profile).
2. Under **Days you work**, tick the days you are available and untick the rest.
3. Tap **Save profile**.

The profile shows the hours set for each day. If your regular hours change, contact Mundoria support so they can be updated.

## How do I take time off?
1. Open your [Diary](/cleaner/diary) and tap **Take time off**.
2. Choose the first and last day you will be away.
3. Add a note if you want one, such as holiday or appointment.
4. Tap **Save time off**.

New visits skip those days. If you already have visits booked in that period, you can tick **Hand back visits already booked in this period**. Mundoria then offers them to other cleaners straight away.

Each visit you hand back counts as a cancellation, so plan time off early where you can. [How do I cancel one or more jobs?](/help/article/cancel-a-job) explains the effect on your reliability.

## What is a plan in my Diary?
Use **Add a plan** for your own commitments, such as a dentist visit. Plans appear in your Diary, and you see a warning if one overlaps a Mundoria visit. A plan does not stop new offers, so use time off for days you cannot work.

## Why keep my calendar accurate?
Accurate hours mean the offers you receive are ones you can accept. That keeps your acceptance rate healthy, as explained in [How do I accept or decline a job?](/help/article/accept-or-decline-jobs). Check your services and areas too, using [How do I choose my services and work areas?](/help/article/services-and-areas).`,
    collection_id: C[1].id,
    slug: "set-availability",
    sort_order: 40,
    summary: "Set your working days and hours in onboarding, turn days on or off on your profile, and use Take time off in your Diary for holidays and appointments.",
    title: "How do I set my availability and time off?",
    topic: "Getting started",
  },
  {
    body: `Mundoria usually reviews a cleaner application within a few working days of you submitting it. The exact time depends on your interview date and how quickly your documents can be verified, so clear uploads and an early interview slot help.

## What happens after I submit?
1. **Application review:** the team checks the information and documents you provided.
2. **Verification:** Mundoria confirms your identity, the required checks and which services you are suited to, including your online interview.
3. **Additional information:** if anything is missing, Mundoria contacts you and explains what to do.
4. **Approval:** your account is activated for the services you are approved for.
5. **Offers:** suitable job offers start to appear in your Jobs page.

## What must be in place before approval?
- A passed 30-minute online interview with the Mundoria team.
- A passed onboarding quiz.
- A profile photo.
- Your UTR number.
- A reviewed Basic DBS certificate.
- Verified Public Liability insurance of at least £1 million.

If you submitted without your UTR, DBS certificate or insurance, approval waits until they arrive. See [What documents do I need?](/help/article/cleaner-documents) for the details.

## How do I track my application?
Your dashboard shows a banner with your current status:
- **Submitted:** your application is in the queue.
- **Under Review:** Mundoria is checking it, or your interview is coming up.
- **Action Required:** something needs your attention, such as a rejected document.

While you wait, keep your interview time free and check the phone number on your profile is correct. You can still update your profile, but you cannot accept bookings before approval.

## What happens when I am approved?
You receive a notification and an email saying you are approved. New cleaners start on the Silver medallion. A payout setup card then appears on your dashboard, so you can connect Stripe and get paid. [How do earnings and fees work?](/help/article/earnings-overview) explains what you earn per job.

## What if my application is put on hold?
If your interview does not pass or a document is rejected, your status shows **Action Required**. Mundoria explains the decision where appropriate and tells you whether you can send more information. Approval also does not guarantee a set number of jobs.

If you have waited longer than expected, [contact Mundoria](/help/article/contact-mundoria-cleaner) with your application reference. You can also read how vetting works in our [FAQ on cleaning professionals](/faq/professionals).`,
    collection_id: C[1].id,
    slug: "how-long-approval",
    sort_order: 50,
    summary: "Review usually takes a few working days after you submit. It depends on your interview date and how quickly Mundoria can verify your documents.",
    title: "How long does cleaner approval take?",
    topic: "Getting started",
  },
  {
    body: `For each job, you earn the booking price minus Mundoria's service fee. Your earnings are shown on every offer before you accept, and the Earnings page breaks each completed job into gross, commission and net.

## Where do I see what a job pays?
Every offer shows the date, time, area and your pay before you decide. The job page shows **Your earnings** again once you have accepted. Pay depends on the booking, so it can differ from job to job.

For team bookings with more than one cleaner, the cleaner share is split equally between the team. The pay shown on a team slot is already your share.

## What does the Earnings page show?
Your [Earnings page](/cleaner/earnings) includes:
- Totals for this week, this month and all time.
- **Completed jobs**, with the gross amount, Mundoria's commission and your net pay for each.
- **Payout history**, showing each payout and its status.
- Your payout schedule, weekly or monthly, and a link to manage payout details.

## What can change my earnings for a job?
The [Booking & Payment Policy](/legal/booking-payment-policy) sets out when earnings can change:
- If the customer changes the agreed scope before or during the visit, the change is shown in the app.
- If a customer is refunded because of a service failure, your earnings may be reduced or reversed.
- Mundoria may hold earnings while a dispute, refund request or chargeback is open.
- Late or repeated cancellations by you may lead to a fee being withheld.

If a customer cancels late, any compensation for you depends on how close to the start they cancelled. It is shown in the app. You can ask support to review any adjustment. [How do I cancel one or more jobs?](/help/article/cancel-a-job) covers your side of cancellations.

## How do I get paid?
Payouts go to your UK bank account through Stripe Connect, weekly or monthly. You set up payouts from your dashboard once Mundoria approves your application. [How and when do I get paid?](/help/article/payouts) explains the timing step by step.

Customers can also add a tip after a clean. See [How do tips work for cleaners?](/help/article/cleaner-tips).

## Does Mundoria deduct tax?
No. You work as a self-employed cleaner, so you are responsible for your own tax and National Insurance. You must declare your income to HMRC through Self Assessment. Stripe emails payout confirmations, and the Earnings page keeps a record of completed jobs.

## Am I guaranteed a certain income?
No. Mundoria does not promise a minimum number of bookings. Offers depend on customer demand, your services, areas, hours and reliability.`,
    collection_id: C[1].id,
    slug: "earnings-overview",
    sort_order: 60,
    summary: "You earn the booking price minus Mundoria's service fee. Each offer shows your pay, and the Earnings page splits every job into gross, commission and net.",
    title: "How do earnings and fees work for cleaners?",
    topic: "Getting started",
  },
  {
    body: `Mundoria sends you offers for jobs that match your services, areas, hours and medallion, and they appear under **Available** on your Jobs page. On the day, you follow the booking details and check in and out in the app, then the customer confirms the completed checklist.

## How do offers reach me?
When Mundoria matches you to a booking, you receive a push notification saying a new cleaning job is waiting. You also get an email if email notifications are on. The offer shows the service, date, time, area and your pay.

- **Direct offers:** you have 30 minutes to accept or decline. A countdown shows on the offer card.
- **Open jobs:** eligible jobs that are still waiting for a cleaner can also appear under Available.
- **Urgent offers:** if the first cleaner cannot take a job, Mundoria contacts reserve cleaners in rank order, three at a time. Each has 15 minutes, and the first to accept takes the job.
- **Team slots:** bookings for more than one cleaner show a **Claim team slot** button. The pay shown is your share.

If you do not answer in time, the offer passes to the next cleaner. [How do I accept or decline a job?](/help/article/accept-or-decline-jobs) explains what each choice means.

## Where do I find my jobs?
Your [Jobs page](/cleaner/jobs) has four tabs:
- **Available:** offers and open jobs you can accept.
- **Upcoming:** jobs you have accepted.
- **Past:** completed jobs.
- **Cancelled:** jobs that were cancelled.

Your dashboard also highlights any offer waiting for an answer and your next session.

## What does the job page show?
Open a job to see the customer's name, the cleaning standard and the date and time. It also shows the address, any special attention areas, add-ons, the customer's instructions and your earnings. A map shows the property location.

Read the instructions before you travel. Customers can mark rooms as off-limits or ask you to avoid certain products. If anything is unclear, ask in the booking chat.

## How does the checklist work?
1. Check in when you arrive and start the clean once the customer confirms you are in.
2. Work through the booked tasks, and use **Upload Photos** if you want to record your work.
3. Tap **Check Out & Complete** when you finish.
4. The customer receives the completed checklist to confirm.

Every item is ticked by default. The customer unticks anything that was not done and gives a reason. [How do check-in and check-out work?](/help/article/check-in-check-out) covers each step.

> Tip: If a clean will not finish in the booked time, tell the customer what is left and only add time if they agree.

To receive more offers, see [How can I receive more job offers?](/help/article/get-more-jobs).`,
    collection_id: C[2].id,
    slug: "job-offers-and-checklists",
    sort_order: 10,
    summary: "Offers arrive by push and email with a countdown to respond. On the day you follow the booking brief, and the customer confirms the checklist afterwards.",
    title: "How do job offers and visit checklists work?",
    topic: "Jobs & sessions",
  },
  {
    body: `Open the offer under **Available** on your Jobs page, or from your dashboard, and tap **Accept** or **Decline** before the countdown ends. Only accept jobs you can reach on time and complete, because declining and cancelling both affect your standing.

## How do I accept a job?
1. Check the date, start time, area and pay on the offer.
2. Tap **Accept** on the offer card, or **Accept job** on the job page.
3. The job shows as awaiting payment while Mundoria secures the customer's payment.
4. You are notified when the visit is confirmed, and it moves to your Upcoming tab.

You cannot accept an offer after its countdown ends. If another cleaner took the job first, you see a message saying it is no longer available.

Accepting is a commitment to attend at the agreed date, time and address. The [Booking & Payment Policy](/legal/booking-payment-policy) explains this in full.

## What happens when I decline?
Declining is allowed, and it is better than accepting a job you cannot do. It still has effects:
- Each decline lowers the acceptance rate shown on your dashboard.
- Declining a job offered directly to you also counts against your reliability score.
- The Jobs page reminds you that repeated declines affect your reliability.
- A job you decline does not reappear in your feed.

Letting an offer run out also lowers your acceptance rate, and the job passes to another cleaner. Acceptance makes up 15% of your monthly performance score.

## Why do I keep seeing jobs I cannot do?
Offers follow the services, areas and hours on your profile. If you often decline for the same reason, update them instead. [How do I set my availability?](/help/article/set-availability) shows how to change your days and add time off.

## What happens after I accept?
Mundoria asks you to confirm the job again as it gets closer:
| Check | When it opens | Time to respond |
| --- | --- | --- |
| 24-hour check | About 24 hours before | 2 hours |
| 6-hour check | About 6 hours before | 45 minutes |
| 1-hour check | About 1 hour before | 20 minutes |

Tap **Confirm** on the job page each time. Confirming the 1-hour check also marks you as on your way. If you tap **Can't make it** or miss the window, the job goes to another cleaner.

If something changes after you accept, release the job as early as possible. [How do I cancel one or more jobs?](/help/article/cancel-a-job) explains how and what it means for your reliability.

For how offers are sent, see [How do job offers and checklists work?](/help/article/job-offers-and-checklists).`,
    collection_id: C[2].id,
    slug: "accept-or-decline-jobs",
    sort_order: 20,
    summary: "Open the offer and tap Accept or Decline before the countdown ends. Accept only jobs you can attend, as declines and cancellations both count.",
    title: "How do I accept or decline a job?",
    topic: "Jobs & sessions",
  },
  {
    body: `You check in by tapping **I have arrived** on the job page when you reach the address. You check out with **Check Out & Complete** when you finish. Both use your phone's location to confirm you are at the property, so allow location access before you set off.

## What are the steps on the day?
1. When you leave for a confirmed job, tap **I'm On My Way**.
2. At the address, tap **I have arrived**. Check-in opens 60 minutes before the visit starts.
3. The customer is told you have arrived. They have 5 minutes to let you in before a waiting charge can apply to them.
4. Once you are inside, tap **Start cleaning**. The clean starts when both you and the customer have confirmed.
5. During the clean, use **Upload Photos** if you want to record your work.
6. When you finish, tap **Check Out & Complete**. The customer then reviews the completed checklist.

If you tap Start cleaning first, you see a message while Mundoria waits for the customer to confirm they let you in.

## Why does check-in use my location?
Check-in and check-out only work when you are within a set distance of the booking address. You agreed to location capture at check-in and check-out during onboarding. Without that consent, or without location access on your device, you cannot check in.

## What if check-in says I am too far away?
GPS can be inaccurate in some buildings and streets. Move closer to the entrance and try again. If it still fails, tap **Request manual override**. A Mundoria admin then reviews your location. Do not skip check-in or leave without telling anyone.

## What if check-in is not available?
- Before the window opens, you see that check-in opens 60 minutes before the visit.
- After the visit window has passed, check-in closes.
- If a safety alert is open on the job, check-in and completion pause until Mundoria clears the hold. See [How does Safety alert work for cleaners?](/help/article/safety-alert-cleaner).

## Does timing affect my score?
Yes. Your on-time rate counts a visit as on time when the clean starts within 10 minutes of the booked start. On-time arrival makes up 20% of your monthly performance score. Arriving a little early gives the customer time to let you in.

## What happens after check-out?
The job shows as waiting for the customer to confirm the checklist. The customer's payment is captured the next UK calendar day. Your share then joins your next payout, as explained in [How and when do I get paid?](/help/article/payouts).

For the full job flow, read [How do job offers and checklists work?](/help/article/job-offers-and-checklists). If a button does not respond, try the fixes in [I think there's a bug](/help/article/app-bugs).`,
    collection_id: C[2].id,
    slug: "check-in-check-out",
    sort_order: 30,
    summary: "Tap I have arrived at the address to check in and Check Out & Complete when you finish. Both use your location, so allow location access first.",
    title: "How do check-in and check-out work?",
    topic: "Jobs & sessions",
  },
  {
    body: `To cancel a single accepted job, open it and tap **Release this job**. To give back several visits at once, use **Take time off** in your Diary and hand back visits already booked. Cancel as early as you can, because every cancellation affects your reliability and future offers.

## How do I cancel one job?
Which option you use depends on where the job is:
- **Not yet accepted:** tap **Decline** on the offer.
- **Accepted and confirmed:** open the job and tap **Release this job**.
- **On your way, before the clean starts:** **Release this job** is still available on the job page.
- **During a confirmation check:** tap **Can't make it**.

Once the clean has started, you cannot release the job in the app. Contact Mundoria straight away if you cannot continue.

## How do I cancel several jobs?
1. Open your [Diary](/cleaner/diary) and tap **Take time off**.
2. Choose the first and last day you cannot work.
3. Tick **Hand back visits already booked in this period**.
4. Tap **Save time off**.

The Diary tells you how many visits were handed back. New offers also skip those days. [How do I set my availability?](/help/article/set-availability) covers time off in more detail.

## What happens to the customer?
Mundoria looks for another cleaner straight away, starting with reserve cleaners who were next in line. The customer is told Mundoria is arranging a replacement. You must not send someone else in your place.

## How does cancelling affect me?
- Each released or handed-back job counts as a cancellation and lowers your reliability score.
- Lower reliability means you rank lower for new offers.
- After repeated cancellations, you stop receiving new offers, except from customers who asked for you.
- A cancellation resets your visit streak on the dashboard to zero.
- Late or repeated cancellations may also lead to a fee being withheld from earnings.

Not attending, or not checking in without telling Mundoria, is a no-show. A no-show can mean losing the earnings for that job, a lower score and suspension if it happens again. The [cleaner agreement](/legal/cleaner-agreement) sets out these rules.

## What if it is a genuine emergency?
Release the job in the app as early as you can and tell Mundoria what happened. Genuine emergencies are treated sympathetically when you tell us promptly. If you become unwell during a visit, notify Mundoria so arrangements can be made with the customer.

## How can I avoid cancelling?
Accept only jobs you are sure you can attend, as explained in [How do I accept or decline a job?](/help/article/accept-or-decline-jobs). Keep your days and time off up to date. Your reliability also feeds your medallion, covered in [How do ratings and medallions work?](/help/article/reviews-and-ratings).`,
    collection_id: C[2].id,
    slug: "cancel-a-job",
    sort_order: 40,
    summary: "Release a single job from its job page, or hand back several visits with Take time off in your Diary. Cancel early, as it affects your reliability.",
    title: "How do I cancel one or more jobs?",
    topic: "Jobs & sessions",
  },
  {
    body: `Use the booking chat in **Messages**, or tap **Message customer** on the job page, to talk to your customer about access, timing or the clean. Keep all contact and payment on Mundoria, because arranging work privately breaks the cleaner agreement.

## Where do I find my conversations?
Your [Messages page](/cleaner/messages) lists one conversation per booking. A conversation appears once you are matched to a job. You can also open the chat from **Message customer** on any job page.

## What can I send?
- Text messages of up to 2,000 characters.
- Up to 4 photos or videos in one message.

The customer gets an in-app notification for each message. Depending on their settings, they may also get a push notification or an email. On team bookings, every cleaner on the team can use the booking chat.

## What should I use the chat for?
- Checking access details, such as a key safe, parking or a concierge.
- Letting the customer know if you are running late.
- Confirming which rooms or tasks matter most to them.
- Agreeing what to do if the clean will not finish in the booked time.

If the job needs more time, tell the customer what is left. Only add time if they agree, and never add hours afterwards without asking.

## What should I not do?
- Do not accept payment, tips or future bookings outside Mundoria.
- Do not ask a customer to cancel and rebook with you privately.
- Do not use customer details for anything except the booking.

If a customer asks to pay you directly or book you privately, explain that payment and future bookings stay on Mundoria. Breaking these rules can lead to suspension and removal.

## Can I call the customer?
Your phone number is the contact Mundoria trusts for jobs, so make sure it is verified. See [How do I verify my phone?](/help/article/verify-phone-cleaner). Keep important details in the booking chat as well, so there is a clear record if a question comes up later.

## What if the customer cannot let me in?
Message them in the chat as soon as you arrive. After you check in, the customer has 5 minutes to let you in before a waiting charge can apply to them. [How do check-in and check-out work?](/help/article/check-in-check-out) explains the arrival steps.

## What if a message is inappropriate?
Do not reply in kind. Keep the messages, as they form a record. If you feel unsafe during a visit, leave and raise a safety alert. Otherwise, follow [How do I report inappropriate behaviour?](/help/article/report-inappropriate-behaviour).`,
    collection_id: C[2].id,
    slug: "message-customers",
    sort_order: 50,
    summary: "Use the booking chat in Messages or tap Message customer on the job page. Keep contact and payment on Mundoria, as private deals break the agreement.",
    title: "How do I message my customer?",
    topic: "Jobs & sessions",
  },
  {
    body: `Mundoria pays you through Stripe Connect into your UK bank account, weekly or monthly as you choose. A job's earnings join your next payout once the customer's payment has been captured, which happens the next UK calendar day after you check out.

## How do I set up payouts?
Payout setup opens after Mundoria approves your application:
1. Open your dashboard and find the **Let's get you paid** card.
2. Tap **Set up payouts** and follow Stripe's steps.
3. Enter your UK bank details. They go straight to Stripe, and Mundoria never stores your sort code or account number.

Stripe may ask for extra verification. Payouts can pause until that is complete. Your profile shows **Ready for payouts** once setup is finished.

## When does the money arrive?
1. You check out at the end of the job.
2. The customer's payment is captured the next UK calendar day.
3. Your share is added to your current payout period. A weekly period runs Monday to Sunday, and a monthly period is a calendar month.
4. Mundoria processes payouts once a week for periods that have ended.
5. Stripe then sends the money to your bank on its own schedule and emails a confirmation.

Earnings may be held while a dispute, refund request or chargeback is open. The [Booking & Payment Policy](/legal/booking-payment-policy) explains when this happens.

## How do I choose weekly or monthly?
Open your profile and choose **Each week** or **Each month** under **Pay me**, then save. You can also change your payout schedule on the Earnings page. Changes apply from the next payout window.

## Where can I track payouts?
Your [Earnings page](/cleaner/earnings) shows each completed job with gross, commission and net pay. **Payout history** lists each payout and its status. To change bank details, tap **Manage payout details**. Stripe may ask you to verify the change.

[How do earnings and fees work?](/help/article/earnings-overview) explains how each job's pay is worked out.

## What if a payout is missing?
Check these first:
- Your profile shows **Ready for payouts**, not **Setup still to finish**.
- The job shows as completed or waiting on the customer, not cancelled.
- The payout period has ended. A monthly payout is only sent after the month closes.
- Stripe has not asked you for more information by email.

If everything looks right, [contact Mundoria](/help/article/contact-mundoria-cleaner) with the job reference from the job page. Tips are covered separately in [How do tips work for cleaners?](/help/article/cleaner-tips).

> Tip: Finish payout setup as soon as you are approved, so your first job's earnings are not held up.`,
    collection_id: C[2].id,
    slug: "payouts",
    sort_order: 60,
    summary: "Mundoria pays you weekly or monthly through Stripe Connect. Each job joins your next payout once the customer's payment is captured after check-out.",
    title: "How and when do I get paid?",
    topic: "Revenue & payouts",
  },
  {
    body: `Customers can add an optional tip by card through Mundoria for up to 24 hours after a clean finishes. Mundoria's Booking & Payment Policy says tips are passed on to you in full, subject to payment provider fees.

## How does a customer tip?
After you check out, the customer's booking page offers the option to add a tip. They choose an amount and pay by card through Mundoria. Each booking can receive one tip, and the option closes 24 hours after the clean finishes.

Tipping is entirely the customer's choice. There is no set amount, and you should not expect a tip on every booking.

## Where do I see my tips?
The Earnings page shows the gross, commission and net pay for each completed job. Tips are not listed there separately at the moment. If you have a question about a tip on a particular job, [contact Mundoria](/help/article/contact-mundoria-cleaner) with the job reference.

Your regular job earnings follow the usual payout timing. [How and when do I get paid?](/help/article/payouts) explains it step by step.

## Can I accept cash tips?
No. The [Booking & Payment Policy](/legal/booking-payment-policy) says you must not accept payment, tips or bookings outside the platform for work introduced through Mundoria. If a customer offers cash, thank them and explain they can tip through the app instead.

Keeping tips on Mundoria also protects you. There is a clear record of what was paid, and disputes are easier to resolve.

## Do tips count towards my rating?
No. Tips and ratings are separate. Your rating comes from the score the customer chooses after the clean, as explained in [How do ratings and medallions work?](/help/article/reviews-and-ratings).

## What helps customers have a good experience?
The things that improve your ratings tend to help here as well:
- Arrive on time and check in properly.
- Read the instructions and follow the booking brief.
- Tell the customer what is left if the clean will not finish in the booked time.
- Leave the property as the customer asked.

## Do I need to declare tips?
You are self-employed, so you are responsible for declaring your income to HMRC. Mundoria does not deduct tax from anything it pays you. [How do earnings and fees work?](/help/article/earnings-overview) covers tax and fees in more detail.`,
    collection_id: C[2].id,
    slug: "cleaner-tips",
    sort_order: 70,
    summary: "Customers can add one optional card tip through Mundoria within 24 hours of a clean. Tips are passed on in full, less payment provider fees.",
    title: "How do tips work for cleaners?",
    topic: "Revenue & payouts",
  },
  {
    body: `After a clean, customers rate the visit as Excellent, Good, Fair, Bad or Awful and can add a comment. Ratings feed your monthly performance score, which sets your medallion: Bronze, Silver, Gold or Rose Gold.

## How do customers rate me?
Customers can rate a visit once you have checked out. Excellent, Good and Fair ratings count straight away.

Bad and Awful ratings are held for 48 hours before they affect your medallion score. You get a push notification and an email when this happens. To challenge one, open your [Performance page](/cleaner/performance), find **Ratings open for dispute** and tap **Dispute**. If you do not dispute it before the deadline, the rating is applied automatically.

## How is my performance score worked out?
| Part of the score | Weight |
| --- | --- |
| Customer rating | 50% |
| On-time arrival | 20% |
| Acceptance of offers | 15% |
| Reliability and cancellations | 15% |

A visit counts as on time when the clean starts within 10 minutes of the booked start. [How do check-in and check-out work?](/help/article/check-in-check-out) explains how the start is recorded.

Your score and medallion are recalculated on the first day of each month, using the previous month. Your medallion can go up or down, and you get a notification when it changes.

## How do medallions work?
New cleaners start on Silver when Mundoria approves them. Each step up needs a higher score, a higher average rating and more completed jobs. Rose Gold also requires no no-shows. Some services are only offered at Silver or Gold, as listed in [How can I receive more job offers?](/help/article/get-more-jobs).

## Where can I see my progress?
Your dashboard shows your medallion, your rating, on-time rate, acceptance rate and visit streak. A cancellation or a missed visit sets the streak back to zero. The Performance page adds your monthly scores and reliability history.

## How does reliability affect my score?
Releasing jobs and handing back visits lowers your reliability. That affects your score, your ranking for offers and, after repeated cancellations, whether you receive new offers at all. See [How do I cancel one or more jobs?](/help/article/cancel-a-job).

## Can customers see my rating?
Once you are matched, customers can see your name, profile photo and ratings, where available. Mundoria only publishes reviews from completed bookings and never invents reviews or ratings.

## Can I rate a customer?
There is no option to rate a customer in the app. If a customer behaved inappropriately, report it instead, using [How do I report inappropriate behaviour?](/help/article/report-inappropriate-behaviour).`,
    collection_id: C[2].id,
    slug: "reviews-and-ratings",
    sort_order: 80,
    summary: "Customers rate each clean from Excellent to Awful. Ratings, punctuality, acceptance and cancellations set your monthly score and your medallion.",
    title: "How do ratings and medallions work?",
    topic: "Reputation & safety",
  },
  {
    body: `You receive more offers by offering services you can do, covering realistic areas and keeping your hours up to date. Reliability matters too. Mundoria first checks which cleaners are eligible for a booking, then ranks them, so being eligible and reliable counts for more than being quick.

## Who is eligible for an offer?
For each booking, Mundoria only considers cleaners who:
- Are approved, with a reviewed DBS certificate and insurance that is in date.
- Offer the booked service.
- Cover the address with their working radius or an extra district.
- Have hours that fit the whole visit on that day.
- Have no overlapping Mundoria visit and no time off that day.
- Hold the medallion the service needs.
- Have not cancelled so often that their reliability is too low.

## Which medallion does each service need?
| Minimum medallion | Services |
| --- | --- |
| Bronze | Regular and one-off house cleaning, office cleaning, retail and hospitality cleaning |
| Silver | Deep cleaning, same-day cleaning, short-let, holiday let and serviced accommodation cleaning, educational facility and communal area cleaning, pregnancy support and bereavement support |
| Gold | End of tenancy, move-in and move-out cleaning, post-construction cleaning, postpartum, illness and injury recovery and hospital discharge cleaning |

[How do ratings and medallions work?](/help/article/reviews-and-ratings) explains how you move up.

## How are eligible cleaners ranked?
1. A cleaner the customer asked for comes first.
2. Then cleaners with higher reliability.
3. Then cleaners with a higher medallion.
4. Then cleaners closer to the address.

Two things lower your ranking slightly. One is a long trip of more than about 5 miles when you only walk or cycle. The other is a booking that needs you to bring products or equipment when you have none.

## What can I do to get more offers?
- Select every service you can genuinely deliver, as covered in [How do I choose my services and work areas?](/help/article/services-and-areas).
- Set a working radius you can reliably cover, up to 15 miles.
- Keep your days and hours current, and add time off early, using [How do I set my availability?](/help/article/set-availability).
- Answer offers before the countdown ends. Declines and missed offers lower your acceptance rate, as explained in [How do I accept or decline a job?](/help/article/accept-or-decline-jobs).
- Avoid releasing jobs, because each one lowers your reliability.
- Keep your insurance in date. A lapsed policy stops new offers until it is renewed.
- Turn on notifications so you see offers quickly.

## Is work guaranteed?
No. Offers depend on customer demand in your area, your settings and your performance. Mundoria does not promise a minimum number of bookings.

The customer view of matching is in our [matching FAQ](/faq/matching).`,
    collection_id: C[2].id,
    slug: "get-more-jobs",
    sort_order: 90,
    summary: "Offer services you can do, cover realistic areas, keep your hours and time off current, and protect your reliability. Ranking favours reliable cleaners.",
    title: "How can I receive more job offers?",
    topic: "Reputation & safety",
  },
  {
    body: `If you feel unsafe during a visit, leave the property, call 999 if you are in danger, then raise a **Safety alert** on the job. For anything else, including behaviour you want Mundoria to know about after a visit, send a report from your Incidents page.

## What should I do during a visit?
Your safety comes first. Do not confront anyone or argue. Stop working if you need to, move somewhere safe and then alert Mundoria. A safety alert pages the Mundoria team and pauses the booking. [How does Safety alert work for cleaners?](/help/article/safety-alert-cleaner) explains each step.

## How do I send an incident report?
1. Open your [Incidents page](/cleaner/incidents).
2. Under **What type of incident?**, choose **Customer behaviour**, or another type that fits.
3. Choose how serious it is: Standard, Urgent or Emergency.
4. Add a short title and describe what happened, who was involved and what you did.
5. Add when and where it happened, if you can.
6. Link the related booking, so Mundoria can see the job details.
7. Tick the box if you have contacted 999 or 101, then tap **Send report**.

The other incident types are injury or illness, property damage, unsafe condition, theft or missing items and other.

## What happens after I report?
The Mundoria team is alerted as soon as you send the report. Your Incidents page lists every report you have sent, with its status: Submitted, Under review, Action required, Resolved or Closed.

## What should I include?
- The date and time it happened.
- What was said or done, in your own words.
- Whether anyone else was present.
- Anything that supports your account, such as messages in the booking chat.

Keep your messages with the customer in the booking chat. [How do I message my customer?](/help/article/message-customers) explains why that record matters. Do not delete anything.

## What counts as inappropriate behaviour?
Report anything that made you feel unsafe or uncomfortable, such as harassment, threats, discriminatory remarks or unwanted contact. Report pressure to take payment or bookings off the platform as well. The [Cleaner Standards & Code of Conduct](/legal/cleaner-standards) sets out the conduct Mundoria expects on every booking.

## What if I damaged something?
Report it promptly from the Incidents page with an accurate description, choosing **Property damage**. Do not offer a private cash refund.

## Who else can I contact?
For questions about a report, [contact Mundoria](/help/article/contact-mundoria-cleaner) with the job reference. In an emergency, always call 999 first. For non-emergencies, you can also call the police on 101.`,
    collection_id: C[2].id,
    slug: "report-inappropriate-behaviour",
    sort_order: 100,
    summary: "If you feel unsafe, leave, call 999 if in danger and raise a Safety alert. For anything else, send a report from your Incidents page.",
    title: "How do I report inappropriate behaviour?",
    topic: "Reputation & safety",
  },
  {
    body: `Safety alert is a button on a live job that pages Mundoria's team when you feel unsafe, have an accident or face an access or property concern. It does not replace emergency services, so call 999 first if you or anyone else is in immediate danger.

## When can I use it?
The **Safety alert** button appears on the job page:
- On the day of a confirmed visit.
- While you are marked as on your way.
- While the clean is in progress.

It is not available for future visits or after a job is complete.

## How do I send a safety alert?
1. Open the job and tap **Safety alert**.
2. If you feel unsafe, leave the property and do not argue. Tap **Call 999** if you are in immediate danger.
3. Tap **Also alert Mundoria**.
4. Choose a reason: unsafe or threatening behaviour, feeling unwell or accident, access or property concern, or something else.
5. Add an optional private note of up to 280 characters.
6. Tap **Continue**, then press and hold **Hold to send safety alert** until it sends.

The hold step stops alerts being sent by accident.

## What happens after I send it?
- Mundoria's team is paged with the booking details and your reason.
- The booking goes on hold. Check-in and completion pause until Mundoria clears the hold.
- The customer is told an alert was raised. They do not see your private note.
- You see a case reference and a button to message Mundoria support.

Stay somewhere you feel safe. A team member will respond. If you are still in danger, call 999.

## What if I sent it by mistake?
Tap **I raised this by mistake** within 15 minutes of sending. Mundoria is told the alert was withdrawn, but the team still needs to clear the hold before the job can continue.

## When should I not use it?
Safety alert is for urgent situations only. For cleaning quality, lateness or breakages, use the incident report instead. [How do I report inappropriate behaviour?](/help/article/report-inappropriate-behaviour) explains how to send one from your Incidents page.

## How do I prepare before a visit?
- Read the booking details, address and access notes before you travel.
- Keep your emergency contact up to date with Mundoria.
- Allow location access, as you need it to check in, as covered in [How do check-in and check-out work?](/help/article/check-in-check-out).
- Only use products and equipment you understand, and follow the labels.

## Where can I learn more?
Customers can raise safety alerts too, and the same rules apply. Our [safety FAQ](/faq/safety) explains how alerts work from both sides. For anything that is not urgent, [contact Mundoria](/help/article/contact-mundoria-cleaner).

> Tip: Mundoria is not an emergency service. If someone is hurt or in danger, call 999 before anything else.`,
    collection_id: C[2].id,
    slug: "safety-alert-cleaner",
    sort_order: 102,
    summary: "Safety alert on a live job pages Mundoria's team and pauses the booking. Call 999 first if you or anyone else is in immediate danger.",
    title: "How does Safety alert work for cleaners?",
    topic: "Reputation & safety",
  },
  {
    body: `Verify your phone on your profile page by sending yourself an SMS code and entering the six digits. To change your email, use the change email form on the same page, confirm your password, then open the link sent to your new address.

## Why should I verify my phone?
Mundoria treats a verified number as the trusted contact for your jobs. Your account needs a phone number before you can use your dashboard. Mundoria also uses the number on your profile to reach you about your interview.

## How do I verify my phone?
1. Open your [profile](/cleaner/profile).
2. Check your mobile number under **Phone number**.
3. Tap **Send SMS code**.
4. Enter the 6-digit code from the text message.
5. Tap **Verify**.

You see a confirmation once the number is verified. The code expires after 10 minutes. If you enter the wrong code five times, request a new one.

## What if I change my number?
Changing your phone number resets verification. Enter the new number, verify it with a fresh SMS code, then tap **Save profile**. Until you verify, Mundoria does not treat the new number as trusted for jobs.

## What if the code does not arrive?
- Check the number is complete and correct, including the area code.
- Make sure your phone has signal and can receive texts.
- Wait a minute, then tap **Resend**.
- If the code has expired, request a new one.

Still stuck? Try the steps in [I think there's a bug](/help/article/app-bugs).

## How do I change my email?
1. On your profile, open the change email form.
2. Enter your new email address.
3. Enter your current password to confirm it is you.
4. Tap **Send confirmation**.
5. Open the confirmation link sent to your new inbox.

Your current email stays active until you confirm the new one. Mundoria also emails your old address to tell you a change was requested. If you did not ask for that change, contact Mundoria straight away.

## Can I change my name?
Your full name is shown on your profile but cannot be edited there. Mundoria checked it against your documents during onboarding. If it needs to change, [contact Mundoria](/help/article/contact-mundoria-cleaner).

## Will customers see my number?
Customers contact you through the booking chat for each job. [How do I message my customer?](/help/article/message-customers) explains how to use it. Keep job conversations in the chat so there is a clear record.`,
    collection_id: C[2].id,
    slug: "verify-phone-cleaner",
    sort_order: 105,
    summary: "Verify your phone on your profile with a 6-digit SMS code. Change your email there too, then confirm it from the link sent to your new inbox.",
    title: "How do I verify my phone or change my email?",
    topic: "App & account",
  },
  {
    body: `Most problems clear after you reload the page or reopen the app, check your connection and allow location access. If the problem continues, contact Mundoria support with the job reference, what you expected, what happened and a screenshot.

## What should I try first?
1. Reload the page, or close and reopen the app.
2. Check your internet connection, and switch between Wi-Fi and mobile data.
3. Make sure you are using the latest version of the app or your browser.
4. Allow location access for Mundoria in your phone settings.
5. Sign out and sign back in at the [cleaner login page](/login/cleaner).

## Why will check-in or check-out not work?
If you see **Enable location access to continue**, your device has blocked location. Turn it on in your settings and try again.

If you are at the address but check-in fails, move closer to the entrance and try again. You can then tap **Request manual override** for an admin to review it. [How do check-in and check-out work?](/help/article/check-in-check-out) covers this in detail.

## Which messages are not bugs?
Some messages explain a rule rather than an error:
- "Check-in opens 60 minutes before the visit." Wait until the window opens.
- "This offer has expired." The countdown ended before you answered.
- "This job is no longer available." Another cleaner accepted it first.
- "You have already answered this offer." Your earlier answer was saved.
- "Accept the job before you set off." The job is still an offer.
- "Waiting for the customer to confirm they have let you in." The customer needs to confirm the start too.

## What if my SMS code does not arrive?
Check your number and signal, wait a minute and tap **Resend**. [How do I verify my phone?](/help/article/verify-phone-cleaner) has more steps.

## How do I report a bug?
1. Go to the [contact page](/contact) or any Help Centre page and tap **Contact us**.
2. In the support chat, choose **A Mundoria cleaner. I already work with Mundoria**.
3. Describe what you expected to happen and what happened instead.
4. Attach a screenshot of the screen or error message.

Include these details so the team can find the problem quickly:
- The job reference shown at the top of the job page.
- Your device and whether you use the app or a browser.
- The date and time the problem happened.

## What if a bug stops me during a live job?
Contact Mundoria straight away through the support chat. Do not leave without telling anyone. If you feel unsafe, use **Safety alert** or call 999. [How can I contact Mundoria?](/help/article/contact-mundoria-cleaner) lists every route.

> Tip: Take a screenshot as soon as something goes wrong. It shows the team exactly what you saw.`,
    collection_id: C[2].id,
    slug: "app-bugs",
    sort_order: 110,
    summary: "Reload or reopen the app, check your connection and allow location. If it still fails, contact support with the job reference and a screenshot.",
    title: "I think there's a bug. What can I do?",
    topic: "App & account",
  },
  {
    body: `Contact Mundoria through the support chat, which opens from **Contact us** on the contact page or any Help Centre page. Choose the option for cleaners who already work with Mundoria, and include your job or application reference so the team can help faster.

## How do I start a support chat?
1. Go to the [contact page](/contact), or open the [Help Centre](/help).
2. Tap **Contact us** to open the support chat.
3. Choose **A Mundoria cleaner. I already work with Mundoria**. If you are still applying, choose the option for future cleaners.
4. Type your question and attach a screenshot if it helps.

If you are signed in, the conversation is linked to your account, so sign in first where you can. The chat also lets you search Help Centre articles while you wait.

## Which route should I use?
| Situation | What to do |
| --- | --- |
| Someone is in immediate danger | Call 999, then use Safety alert on the job |
| You feel unsafe on a live job | Use Safety alert on the job page |
| Incident, injury, damage or customer behaviour | Send a report from your Incidents page |
| Payouts, documents, approval or app problems | Use the support chat |
| Access, timing or tasks for a booking | Use the booking chat with your customer |

[How does Safety alert work for cleaners?](/help/article/safety-alert-cleaner) and [How do I report inappropriate behaviour?](/help/article/report-inappropriate-behaviour) cover the first three routes.

## What should I include?
- The job reference shown at the top of the job page.
- Your application reference, if your question is about onboarding.
- What you need, and what you have already tried.
- Screenshots of any error messages.

Say you are a cleaner in your first message. That helps the team route payout and document questions straight away.

## Can I get help with payouts?
Yes. Before you contact us, check the steps in [How and when do I get paid?](/help/article/payouts). Many payout delays come from unfinished Stripe setup or a payout period that has not ended yet.

## Can I get help with an app problem?
Yes. Try the quick fixes in [I think there's a bug](/help/article/app-bugs) first. If they do not work, send the details listed there.

## Can I send documents through support?
If you submitted your application without a document, or need to send a renewed insurance certificate, contact Mundoria in the chat. The team will tell you how to send it securely.

## How do I close my account?
You can stop using Mundoria at any time. Complete or cancel your accepted jobs first, then contact support. You remain entitled to earnings for completed jobs, subject to any disputes in progress.`,
    collection_id: C[2].id,
    slug: "contact-mundoria-cleaner",
    sort_order: 120,
    summary: "Use the support chat from Contact us on the contact page or Help Centre. Choose the cleaner option and include your job or application reference.",
    title: "How can I contact Mundoria as a cleaner?",
    topic: "App & account",
  },
];
