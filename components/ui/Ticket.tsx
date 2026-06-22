import { QRCodeSVG } from "qrcode.react";

interface TicketProps {
  /** Public registration number (distinct from BIB, FR-407). */
  registrationNumber: string;
  name: string;
  event: string;
  distance: string;
  /** Set only for running events (FR-404); falsy hides the row. */
  ageClass?: string;
  /** Set only for running events; falsy hides the row. */
  gender?: string;
  date?: string;
  /** Opaque token encoded into the QR for check-in (FR-604/705). */
  qrToken: string;
  className?: string;
}

export default function Ticket({
  registrationNumber,
  name,
  event,
  distance,
  ageClass,
  gender,
  date,
  qrToken,
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
            <span className="ticket-grid-lab">Jarak</span>
            <span className="ticket-grid-val">{distance}</span>
          </div>
          {gender && (
            <div className="ticket-grid-item">
              <span className="ticket-grid-lab">Jenis Kelamin</span>
              <span className="ticket-grid-val">
                {gender === "male" ? "Laki-laki" : gender === "female" ? "Perempuan" : gender}
              </span>
            </div>
          )}
          {ageClass && (
            <div className="ticket-grid-item">
              <span className="ticket-grid-lab">Kelas Usia</span>
              <span className="ticket-grid-val">{ageClass}</span>
            </div>
          )}
          {date && (
            <div className="ticket-grid-item">
              <span className="ticket-grid-lab">Tanggal</span>
              <span className="ticket-grid-val">{date}</span>
            </div>
          )}
        </div>
      </div>
      <div className="ticket-stub">
        <div className="ticket-bib" style={{ fontFamily: "var(--font-mono)" }}>{registrationNumber}</div>
        <div className="ticket-qr" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <QRCodeSVG value={qrToken} size={72} level="M" />
        </div>
      </div>
    </div>
  );
}
