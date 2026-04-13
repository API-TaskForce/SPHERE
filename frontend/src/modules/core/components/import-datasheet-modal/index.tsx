import FileUpload from '../file-upload-input';

export default function ImportDatasheetModal({
  modalState,
  handleClose,
  onSubmit,
}: {
  modalState: boolean;
  handleClose: () => void;
  onSubmit: (file: File) => void;
}) {
  if (!modalState) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-[20px] p-8 max-w-[500px] w-[90dvw] shadow-xl flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <FileUpload
          onSubmit={onSubmit}
          submitButtonText="Upload datasheet"
          isDragActiveText="Drop the datasheet file here"
          isNotDragActiveText="Drag and drop a datasheet file here"
        />
      </div>
    </div>
  );
}
