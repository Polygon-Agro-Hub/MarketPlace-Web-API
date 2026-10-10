const PGdao = require("../dao/PaymentGateway-dao");
const { PaymentsLk } = require('@payments-lk/node');

const lk = new PaymentsLk(process.env.PAYMENTS_LK_SECRET_KEY); // sk_test_ while you build

exports.saveCard = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
        // Offer to keep the card. The customer decides on the checkout page.
        const checkout = await lk.checkouts.create({ amountCents: 10, description: "Weekly box", saveCard: true, customer: { name: "Ruwan", email: "ruwan@example.lk" } });

        // Later, from your own records, or by asking for the customer's cards.
        const page = await lk.cards.list({ customerEmail: "ruwan@example.lk" });
        for await (const card of lk.cards.listAll({ customerEmail: "ruwan@example.lk" })) {
            console.log(card.id, card.scheme, card.last4, card.expiry);
        }

        const payment = await lk.cards.charge(page.data[0].id, { amountCents: 10, description: "Weekly box" }, { idempotencyKey: "box-1042-2026-10" });
        await lk.cards.delete(page.data[0].id)
    } catch (err) {
        console.error("Error during get product:", err);
        res.status(500).json({ error: "An error occurred during retrieval." });
    }
};