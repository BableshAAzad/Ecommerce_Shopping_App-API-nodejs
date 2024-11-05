import ContactModel from "../models/contact.js";
import AddressModel from "../models/address.js";

class ContactController {
    // ^---------------------------------------------------------------------------------------------------------
    // Method to add a new contact
    static addContact = async (req, resp) => {
        const { contactNumber, priority } = req.body;
        const addressId = req.params.addressId;

        if (!contactNumber || !priority) {
            return resp.status(400).send({
                status: 400,
                message: "Contact number and priority are required"
            });
        }

        try {
            // Check if the contact number or priority already exists for the specified address
            const existingAddress = await AddressModel.findById(addressId).populate("contacts").exec();

            if (!existingAddress) {
                return resp.status(404).send({
                    status: 404,
                    message: "Address not found",
                    rootCause: "Invalid address ID"
                });
            }

            const duplicateContact = existingAddress.contacts.find(
                (contact) =>
                    contact.contactNumber == contactNumber ||
                    contact.priority === priority
            );

            if (duplicateContact) {
                return resp.status(400).send({
                    status: 400,
                    message: "Duplicate contact",
                    rootCause: `A contact with the same ${duplicateContact.contactNumber == contactNumber ? 'number' : 'priority'} already exists`
                });
            }

            // Create new contact
            const newContact = new ContactModel({ contactNumber, priority });
            const savedContact = await newContact.save();

            // Link the new contact to the address
            await AddressModel.findByIdAndUpdate(
                addressId,
                { $push: { contacts: savedContact._id } }, // Push new contact ID to contacts array
                { new: true }
            );

            resp.status(201).send({
                status: 201,
                message: "Contact added successfully",
                data: savedContact
            });

        } catch (error) {
            console.error(error);
            resp.status(500).send({
                status: 500,
                message: "Failed to add contact",
                rootCause: error.message
            });
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
    // Method to update a contact by Id
    static updateContact = async (req, resp) => {
        try {
            const { contactId, addressId } = req.params;
            const contactData = req.body; // Incoming request { contactNumber: '8319316055', priority: 'PRIMARY' }

            if (!contactId || !addressId) {
                return resp.status(400).send({
                    status: 400,
                    message: "Please provide both contactId and addressId"
                });
            }

            // Check if contact and address exist
            const exist_contact = await ContactModel.findById(contactId);
            const exist_address = await AddressModel.findById(addressId)
                .populate("contacts") // Populate contacts field
                .exec();

            if (!exist_contact) {
                return resp.status(404).send({
                    status: 404,
                    message: "Failed to update contact",
                    rootCause: "Contact ID does not exist"
                });
            }

            if (!exist_address) {
                return resp.status(404).send({
                    status: 404,
                    message: "Failed to update contact",
                    rootCause: "Address ID does not exist"
                });
            }

            // Check for existing contact with the same number or priority in the same address
            const duplicateContact = exist_address.contacts.find(
                (contact) =>
                    contact._id.toString() !== contactId && // Ignore the current contact being updated
                    (contact.contactNumber == contactData.contactNumber ||
                        contact.priority === contactData.priority)
            );

            if (duplicateContact) {
                return resp.status(400).send({
                    status: 400,
                    message: "Duplicate contact",
                    rootCause: `A contact with the same ${duplicateContact.contactNumber == contactData.contactNumber ? 'number' : 'priority'} already exists`
                });
            }

            // Update contact details
            exist_contact.contactNumber = contactData.contactNumber || exist_contact.contactNumber;
            exist_contact.priority = contactData.priority || exist_contact.priority;

            await exist_contact.save();

            resp.status(200).send({
                status: 200,
                message: "Contact updated successfully",
                updatedContact: exist_contact
            });

        } catch (error) {
            resp.status(500).send({
                status: 500,
                message: "Failed to update contact",
                rootCause: error.message
            });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------

}

export default ContactController;
