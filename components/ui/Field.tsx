import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, useId } from "react";

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
          onChange={props.onChange}
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
