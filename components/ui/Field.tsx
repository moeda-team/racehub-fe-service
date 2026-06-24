import { ChangeEvent, ChangeEventHandler, InputHTMLAttributes, SelectHTMLAttributes, ReactNode, useId } from "react";
import { normalizeNumberInput } from "@/lib/format";

interface FieldBaseProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}

// Common text-like input types. Kept as a literal union (no `string & {}`) so
// the discriminated union below can narrow on `type === "select"`.
type FieldInputType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "search"
  | "number"
  | "date"
  | "datetime-local";

interface FieldInputProps
  extends FieldBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  type?: FieldInputType;
}

interface FieldSelectProps
  extends FieldBaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  type: "select";
  children: ReactNode;
}

type FieldProps = FieldInputProps | FieldSelectProps;

export default function Field(props: FieldProps) {
  const { label, hint, error, className = "" } = props;
  const id = useId();
  const inputId = props.id ?? id;
  const hasError = !!error;

  // For number inputs, strip leading zeros before bubbling the change up so a
  // field that starts at "0" doesn't keep it (e.g. "09000" -> "9000").
  const handleInputChange: ChangeEventHandler<HTMLInputElement> | undefined =
    props.type === "number" && props.onChange
      ? (e: ChangeEvent<HTMLInputElement>) => {
          const normalized = normalizeNumberInput(e.target.value);
          if (normalized !== e.target.value) e.target.value = normalized;
          props.onChange!(e);
        }
      : (props.onChange as ChangeEventHandler<HTMLInputElement> | undefined);

  return (
    <div className={`field ${className}`}>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      {props.type === "select" ? (
        <select
          id={inputId}
          className="field-input"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          disabled={props.disabled}
          name={props.name}
          value={props.value}
          onChange={props.onChange}
          required={props.required}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={inputId}
          className="field-input"
          type={props.type ?? "text"}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          disabled={props.disabled}
          name={props.name}
          placeholder={props.placeholder}
          value={props.value}
          onChange={handleInputChange}
          required={props.required}
        />
      )}
      {hasError && (
        <span id={`${inputId}-err`} className="field-error" role="alert">
          {error}
        </span>
      )}
      {!hasError && hint && (
        <span id={`${inputId}-hint`} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}
