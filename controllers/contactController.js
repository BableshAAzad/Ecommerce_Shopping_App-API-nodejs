import ContactModel from "../models/contact.js";
import AddressModel from "../models/address.js";

class ContactController {
    // ^---------------------------------------------------------------------------------------------------------
    // Method to add a new contact
    static addContact = async (req, resp) => {
        const { contactNumber, priority } = req.body; // Assuming addressId if linking with an address
        const addressId = req.params.addressId

        if (!contactNumber || !priority) {
            return resp.status(400).send({ status: 400, message: "Contact number and priority are required" });
        }
        try {
            // Create new contact
            const newContact = new ContactModel({ contactNumber, priority });
            const savedContact = await newContact.save();

            // If linking to an address, find the address and update contacts array
            if (addressId) {
                await AddressModel.findByIdAndUpdate(
                    addressId,
                    { $push: { contacts: savedContact._id } }, // Push new contact ID to contacts array
                    { new: true }
                );
                resp.status(201).send({ status: 201, message: "Contact added successfully", data: savedContact });
            } else {
                resp.status(400).send({ status: 400, message: "Failed to add contact", rootCause: error.message });
            }
        } catch (error) {
            console.error(error);
            resp.status(500).send({ status: 500, message: "Failed to add contact", rootCause: error.message });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------

    // Method to retrieve a contact by ID
    static getContact = async (req, resp) => {
        const contactId = req.params.contactId;

        try {
            const contact = await ContactModel.findById(contactId);
            if (!contact) {
                return resp.status(404).send({ status: 404, message: "Contact not found" });
            }

            resp.status(200).send({ status: 200, message: "Contact found", data: contact });
        } catch (error) {
            console.error(error);
            resp.status(500).send({ status: 500, message: "Failed to retrieve contact", rootCause: error.message });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------

    // ^---------------------------------------------------------------------------------------------------------

}

export default ContactController;
