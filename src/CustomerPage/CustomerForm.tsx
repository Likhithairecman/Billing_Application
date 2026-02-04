import type { Customer } from "../types/loan";

type Props = {
  customer: Customer;
  setCustomer: (customer: Customer) => void;
};

export default function CustomerForm({ customer, setCustomer }: Props) {
  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          placeholder="First Name"
          style={{ flex: 1 }}
          value={customer.first_name}
          onChange={e => {
            const firstName = e.target.value;
            setCustomer({
              ...customer,
              first_name: firstName,
              customer_name: `${firstName} ${customer.last_name}`.trim(),
            });
          }}
        />
        <input
          placeholder="Last Name"
          style={{ flex: 1 }}
          value={customer.last_name}
          onChange={e => {
            const lastName = e.target.value;
            setCustomer({
              ...customer,
              last_name: lastName,
              customer_name: `${customer.first_name} ${lastName}`.trim(),
            });
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'white', marginBottom: '10px' }}>
        <span style={{ padding: '10px 12px', background: '#f3f4f6', borderRight: '1px solid var(--border)', color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
          +91
        </span>
        <input
          placeholder="Phone"
          value={customer.customer_phone || ""}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            setCustomer({ ...customer, customer_phone: val });
          }}
          onBlur={() => {
            if (customer.customer_phone && customer.customer_phone.length !== 10) {
              alert("Number is invalid");
            }
          }}
          style={{ border: 'none', boxShadow: 'none', borderRadius: 0, flex: 1, outline: 'none', padding: '10px' }}
        />
      </div>
      {(customer.customer_phone && customer.customer_phone.length !== 10) && (
        <span style={{ color: 'red', fontSize: '12px', marginBottom: '10px', display: 'block' }}>Number is invalid</span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'white', marginBottom: '10px' }}>
        <span style={{ padding: '10px 12px', background: '#f3f4f6', borderRight: '1px solid var(--border)', color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
          +91
        </span>
        <input
          placeholder="Alternate Phone"
          value={customer.customer_phone_alternate || ""}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            setCustomer({ ...customer, customer_phone_alternate: val });
          }}
          onBlur={() => {
            if (customer.customer_phone_alternate && customer.customer_phone_alternate.length !== 10) {
              alert("Number is invalid");
            }
          }}
          style={{ border: 'none', boxShadow: 'none', borderRadius: 0, flex: 1, outline: 'none', padding: '10px' }}
        />
      </div>
      {(customer.customer_phone_alternate && customer.customer_phone_alternate.length !== 10) && (
        <span style={{ color: 'red', fontSize: '12px', marginBottom: '10px', display: 'block' }}>Number is invalid</span>
      )}

      <input
        placeholder="Email"
        value={customer.customer_email || ""}
        onChange={e =>
          setCustomer({ ...customer, customer_email: e.target.value })
        }
      />

      <textarea
        placeholder="Address"
        value={customer.customer_address || ""}
        onChange={e =>
          setCustomer({ ...customer, customer_address: e.target.value })
        }
      />
    </>
  );
}
