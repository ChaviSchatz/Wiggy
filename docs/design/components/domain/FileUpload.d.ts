export interface FileUploadProps {
  label?: string;
  hint?: string;
  accept?: string;
  onSelect?: (files: File[]) => void;
}
export function FileUpload(props: FileUploadProps): JSX.Element;
