import AddressModel from "../models/address.js";

class AddressController {
    // ^---------------------------------------------------------------------------------------------------------
    static addAddress = async (req, resp) => {
        const _id = req.params.userId;
        if (_id) {
            try {
                let userId = req.user.userId.toString()
                let user = req.user
                if (_id === userId) {
                    req.body.userId = _id;
                    let countAddress = await AddressModel.countDocuments(); // Get total item count
                    if (user.userRole === "SELLER" && countAddress === 0 || user.userRole === "CUSTOMER" && countAddress <= 4) {
                        let address = new AddressModel(req.body)
                        address = await address.save()
                        resp.status(201).send({ status: 201, message: "Address added successfully", data: address });
                    } else if (user.userRole === "SELLER") {
                        resp.status(500).send({ status: 500, message: "Error Address add failed", rootCause: "Seller should have only one address" });
                    } else if (user.userRole === "CUSTOMER") {
                        resp.status(500).send({ status: 500, message: "Error Address add failed", rootCause: "Customer should have only max 4 addresses" });
                    }
                } else {
                    resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error Address add failed", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing User ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getAddresses = async (req, resp) => {
        const _id = req.params.userId;
        if (_id) {
            try {
                let userId = req.user.userId.toString()
                if (_id === userId) {
                    let addresses = await AddressModel.find({ userId: _id })
                        .populate("contacts") // Populate contacts field
                        .exec();

                    resp.status(200).send({ status: 200, message: "Addresses are founded", data: addresses })
                } else {
                    resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error Address fetch failed", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing User ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static updateAddress = async (req, resp) => {
        const _id = req.params.addressId;
        if (_id) {
            try {
                // Find the address by ID and ensure it belongs to the authenticated user
                let address = await AddressModel.findOne({ _id: _id, userId: req.user.userId });
                if (!address) {
                    // Address not found or does not belong to the user
                    return resp.status(404).send({ status: 404, message: "Address not found or access denied" });
                }
                // Update the address with new data
                Object.assign(address, req.body);
                // Save the updated address
                await address.save();
                resp.status(200).send({ status: 200, message: "Address updated successfully", data: address });
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error Address update failed", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing address ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getAddress = async (req, resp) => {
        let { addressId } = req.params
        if (addressId) {
            let address = await AddressModel.findById({ _id: addressId })
                .populate("contacts") // Populate contacts field
                .exec();
            if (address) {
                resp.status(200).send({ status: 200, message: "Address founded", data: address });
            } else {
                resp.status(400).send({ status: 400, message: "Illegal Operation: Invalid address ID" });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing address ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------

}

export default AddressController