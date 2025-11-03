use soroban_sdk::{contracttype, Address};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,                       // dirección del administrador del contrato
    Token,                       // dirección del token de pago aceptado
    ContractBalance,             // balance total del contrato
    Commission,                   // porcentaje de comisión (basis points)
    AdminCommissionBalance,      // balance acumulado de comisiones del administrador
    Car(Address),                // auto asociado a un owner
    Rental(Address, Address),    // registro de alquiler entre renter y owner
    CarOwners,                   // lista de todos los owners que tienen autos
}
