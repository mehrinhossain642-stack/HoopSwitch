/**
 * Onboarding's text input is the app's text input — there was no reason for the
 * flow to keep a second implementation with its own focus and error styling.
 * Re-exported so the step screens keep reading in their own vocabulary.
 */
export { FieldLabel as Label, TextField as FormField } from '../TextField';
