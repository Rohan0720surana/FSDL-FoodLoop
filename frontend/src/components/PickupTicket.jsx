import CountdownTimer from "./CountdownTimer";

// The "trip ticket" a recipient's staff carry to the donor: route, load and handover code.
export default function PickupTicket({ from, to, food, meals, deadline, distanceKm, etaMin, code = "4827", children }) {
  return (
    <div className="fl-ticket">
      <div className="sect">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fl-text-xs text-muted-fl">Pickup · accepted 9:21 pm</span>
          <CountdownTimer deadline={deadline} />
        </div>
        <div className="fl-route">
          <div className="stop">
            <div className="k">Collect from</div>
            <div className="n">{from}</div>
          </div>
          <div className="stop to">
            <div className="k">Bring back to</div>
            <div className="n">{to}</div>
          </div>
        </div>
        <div className="d-flex flex-column gap-1 fl-text-sm mt-1">
          <span><strong>{meals}</strong> meals · {food}</span>
          <span className="text-secondary-fl">{distanceKm} km · ~{etaMin} min</span>
        </div>
      </div>
      <div className="tear" />
      <div className="sect d-flex justify-content-between align-items-end gap-3">
        <div>
          <div className="fl-text-xs text-muted-fl mb-1">Handover code, show at the kitchen</div>
          <div className="fl-code">{code}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
