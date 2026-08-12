/**
 * Onboarding's text input is the app's text input — there was no reason for the
 * flow to keep a second implementation with its own focus and error styling.
 * Kept as a re-export so the step screens read in their own vocabulary.
 */
export { FieldLabel as Label, TextField as FormField } from '../TextField';
