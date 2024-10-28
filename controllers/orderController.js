import OrderModel from "../models/order.js";
import AddressModel from "../models/address.js"
import ProductModel from "../models/product.js";
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import OrderInvoiceModel from "../models/orderInvoice.js"

class OrderController {
    // ^---------------------------------------------------------------------------------------------------------
    static addOrder = async (req, resp) => {

        let { userId, addressId, productId } = req.params
        if (!userId || !addressId || !productId)
            return resp.status(400).send({ status: 400, message: "Illegal Operation: Missing ID" });

        const authUserId = req.user.userId.toString();
        if (userId !== authUserId) return resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });

        const address = await AddressModel.findOne({ _id: addressId })
            .populate("contacts") // Populate contacts field
            .exec();
        if (!address) return resp.status(404).send({ status: 404, message: "Address not found", });

        const product = await ProductModel.findOne({ _id: productId });
        if (!product) return resp.status(404).send({ status: 404, message: "Product not found", });

        let { totalQuantity, totalPrice, discount, discountPrice, totalPayableAmount } = req.body
        if (!totalQuantity || !totalPrice || !discount || !discountPrice || !totalPayableAmount) {
            return resp.status(400).send({ status: 400, message: "Illegal Operation: All fields are mandatory" });
        }

        if (totalQuantity > product.stocks) return resp.status(404).send({ status: 404, message: "Product not found", });

        let order = new OrderModel({
            totalQuantity: totalQuantity,
            totalPrice: totalPrice,
            discount: discount,
            discountPrice: discountPrice,
            totalPayableAmount: totalPayableAmount,
            invoiceDate: new Date(),
            product: productId,
            address: address._id,
            user: userId
        })

        let saved_order = await order.save()

        await ProductModel.findByIdAndUpdate(
            productId,
            { $inc: { stocks: -totalQuantity } }
        );

        // * create invoice in pdf formate
        const orderRequestDto = {
            orderId: saved_order._id,
            customerId: userId,
            totalQuantity,
            totalPrice,
            discount,
            discountPrice,
            totalPayableAmount,
            invoiceDate: order.date,
            addressDto: address
        };

        try {
            let invoiceByte = await OrderController.createPdf(orderRequestDto, productId, product.price)
            let orderInvoice = new OrderInvoiceModel({
                order: saved_order._id,
                pdfData: invoiceByte
            })
            let saved_orderInvoice = await orderInvoice.save();
        } catch (error) {
            console.log(error)
            return resp.status(400).send({ status: 400, message: "Invoice creation failed" });
        }

        return resp.status(200).send({ status: 200, message: "Order created", data: saved_order });
    }
    // ^---------------------------------------------------------------------------------------------------------

    static createPdf(orderRequestDto, inventoryId, inventoryPrice) {
        const doc = new PDFDocument();
        const chunks = [];

        // Write output to a buffer
        const writableStream = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            }
        });

        doc.pipe(writableStream);

        // Add title
        doc.fontSize(25).font('Helvetica-Bold').text("Ecommerce Shopping Application", {
            align: 'center'
        });
        doc.moveDown(1);

        // Create table headers for invoice details
        doc.fontSize(16).font('Helvetica-Bold').text("Invoice Details", { align: 'center' });
        doc.moveDown(0.5);

        // Order details table
        OrderController.addTableRow(doc, "Date:", orderRequestDto.invoiceDate || new Date());
        OrderController.addTableRow(doc, "Order Id:", orderRequestDto.orderId);
        OrderController.addTableRow(doc, "Customer Id:", orderRequestDto.customerId);
        OrderController.addTableRow(doc, "Product Id:", inventoryId);
        OrderController.addTableRow(doc, "Product Price:", inventoryPrice);
        OrderController.addTableRow(doc, "Total Quantity:", orderRequestDto.totalQuantity);
        OrderController.addTableRow(doc, "Total Price:", orderRequestDto.totalPrice);
        OrderController.addTableRow(doc, "Discount:", `${orderRequestDto.discount}%`);
        OrderController.addTableRow(doc, "Discount Price:", orderRequestDto.discountPrice);
        OrderController.addTableRow(doc, "Total Paid Amount:", orderRequestDto.totalPayableAmount);

        // Address information
        const address = orderRequestDto.addressDto;
        OrderController.addTableRow(doc, "Address:",
            `Street: ${address.streetAddress}\n` +
            `Street Additional: ${address.streetAddressAdditional}\n` +
            `City: ${address.city}\n` +
            `State: ${address.state}\n` +
            `Country: ${address.country}\n` +
            `Pincode: ${address.pincode}`
        );
        if (address.contacts && address.contacts.length > 0) {
            OrderController.addTableRow(doc, `${address.contacts[0].priority} Contact: `, address.contacts[0].contactNumber);
        }
        if (address.contacts && address.contacts.length === 2) {
            OrderController.addTableRow(doc, `${address.contacts[1].priority} Contact: `, address.contacts[1].contactNumber);
        }
        // Finalize PDF
        doc.end();

        return new Promise((resolve, reject) => {
            writableStream.on('finish', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });
            writableStream.on('error', reject);
        });
    }

    // Helper function to add table rows
    static addTableRow(doc, label, value) {
        doc.fontSize(12).font('Helvetica-Bold').text(label, { continued: true });
        doc.font('Helvetica').text(value);
        doc.moveDown(0.3);
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getOrders = async (req, resp) => {
        const _id = req.params.userId;
        if (_id) {
            try {
                let userId = req.user.userId.toString()
                if (_id === userId) {

                    const orders = await OrderModel.find({ user: _id })
                        .populate("product") // Populate contacts field
                        .exec();
                    if (orders && orders.length > 0) {
                        const customizedOrders = orders.map(order => ({
                            orderId: order._id, // Renaming _id to id
                            inventoryTitle: order.product.productTitle,
                            inventoryImage: order.product.productImage,
                            invoiceDate: order.invoiceDate,
                            invoiceLink: ""
                        }));
                        return resp.status(200).send({ status: 200, message: "Orders found", data: customizedOrders });
                    } else {
                        return resp.status(404).send({ status: 404, message: "No orders found for this user" });
                    }

                } else {
                    resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error order fetch failed", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing User ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getInvoice = async (req, resp) => {
        const { orderId } = req.params;
        try {
            const orderInvoice = await OrderInvoiceModel.findOne({ order: orderId });
            if (!orderInvoice) {
                return resp.status(404).send({ status: 404, message: "Invoice not found" });
            }

            // Set the content type for PDF
            resp.setHeader('Content-Type', 'application/pdf');
            resp.setHeader('Content-Disposition', `inline; filename="invoice_${orderId}.pdf"`);

            // Send the PDF data
            resp.send(orderInvoice.pdfData);
        } catch (error) {
            console.error(error);
            resp.status(500).send({ status: 500, message: "Error retrieving invoice", rootCause: error.message });
        }
    }

    // ^---------------------------------------------------------------------------------------------------------

}

export default OrderController