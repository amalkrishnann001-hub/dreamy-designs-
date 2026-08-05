// ==========================================
// DREAMY DESIGNS
// WhatsApp Ordering
// ==========================================


// IMPORTANT:
// Replace this number with the Dreamy Designs
// WhatsApp number.
//
// Use country code.
// Example for India:
// 919876543210
//
// Do NOT add + or spaces.

const whatsappNumber = "919XXXXXXXXX";


function orderProduct(productName, price) {

    const message =
        "Hello Dreamy Designs! 🌸%0A%0A" +
        "I would like to order:%0A" +
        "Product: " + productName + "%0A" +
        "Price: ₹" + price + "%0A%0A" +
        "Please provide the order details. Thank you! 💕";

    const whatsappURL =
        "https://wa.me/" + whatsappNumber +
        "?text=" + message;

    window.open(whatsappURL, "_blank");
}


function contactWhatsApp() {

    const message =
        "Hello Dreamy Designs! 🌸%0A%0A" +
        "I would like to know more about your products.";

    const whatsappURL =
        "https://wa.me/" + whatsappNumber +
        "?text=" + message;

    window.open(whatsappURL, "_blank");
}