interface TicketProps {
  bib: string;
  name: string;
  event: string;
  distance: string;
  ageClass: string;
  date: string;
  email: string;
  className?: string;
}

export default function Ticket({
  bib,
  name,
  event,
  distance,
  ageClass,
  date,
  email,
  className = "",
}: TicketProps) {
  return (
    <div className={`ticket ${className}`}>
      <div className="ticket-info">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>
          {event}
        </div>
        <div className="ticket-grid">
          <div className="ticket-grid-item">
            <span className="ticket-grid-lab">Nama</span>
            <span className="ticket-grid-val">{name}</span>
          </div>
          <div className="ticket-grid-item">
            <span className="ticket-grid-lab">Email</span>
            <span className="ticket-grid-val">{email}</span>
          </div>
          <div className="ticket-grid-item">
            <span className="ticket-grid-lab">Jarak</span>
            <span className="ticket-grid-val">{distance}</span>
          </div>
          <div className="ticket-grid-item">
            <span className="ticket-grid-lab">Kelas Usia</span>
            <span className="ticket-grid-val">{ageClass}</span>
          </div>
          <div className="ticket-grid-item">
            <span className="ticket-grid-lab">Tanggal</span>
            <span className="ticket-grid-val">{date}</span>
          </div>
        </div>
      </div>
      <div className="ticket-stub">
        <div className="ticket-bib">{bib}</div>
        <div className="ticket-qr">QR Placeholder</div>
      </div>
    </div>
  );
}
