import * as React from 'react';
import { animated, useSpring } from '@react-spring/web';
import { FaFolder, FaFolderOpen, FaFile, FaFilePdf, FaImage, FaTrash } from 'react-icons/fa';
import { FaVideo } from 'react-icons/fa6';
import { MdDeleteForever } from 'react-icons/md';
import { IoIosLink } from 'react-icons/io';
import { FiDownload } from 'react-icons/fi';
import { AnalyticsDataEntry } from '../../../../assets/data/analytics';
import { FileExplorerContext } from '../../../pricing/contexts/fileExplorerContext';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useDatasheetsApi } from '../../api/datasheetsApi';
import customAlert from '../../../core/utils/custom-alert';
import customConfirm from '../../../core/utils/custom-confirm';
import CopyToClipboardIcon from '../../../core/components/copy-icon';

type FileType = 'image' | 'pdf' | 'doc' | 'video' | 'folder' | 'pinned' | 'trash';

type TreeItem = {
  id: string;
  label: string;
  fileType?: FileType;
  children?: TreeItem[];
};

function getIconFromFileType(fileType?: FileType) {
  switch (fileType) {
    case 'image': return <FaImage />;
    case 'pdf': return <FaFilePdf />;
    case 'doc': return <FaFile />;
    case 'video': return <FaVideo />;
    case 'folder': return <FaFolder />;
    case 'pinned': return <FaFolderOpen />;
    case 'trash': return <FaTrash />;
    default: return <FaFile />;
  }
}

function AnimatedCollapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const style = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0px)' : 'translateY(10px)',
    overflow: 'hidden',
  });
  return open ? <animated.div style={style}>{children}</animated.div> : null;
}

function TreeNode({
  item,
  depth = 0,
  expandedIds,
  toggleExpand,
}: {
  item: TreeItem;
  depth?: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const { removeDatasheetVersion } = useDatasheetsApi();
  const { pricingOwner, setSelectedYamlLink, setYamlLinkModalOpen } = React.useContext(FileExplorerContext);
  const { authUser } = useAuth();

  const isExpanded = expandedIds.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const isDoc = item.fileType === 'doc';

  const handleDownload = () => {
    const fileName = item.label;
    if (!fileName) { customAlert('No file selected.'); return; }
    const saasName = fileName.split('/')[fileName.split('/').length - 2];
    const version = fileName.split('/')[fileName.split('/').length - 1];
    fetch(fileName).then(async response => {
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectURL;
      link.download = `${saasName}-${version}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectURL);
    });
  };

  const handleCopyLink = () => {
    if (!item.label) { customAlert('No file selected.'); return; }
    setSelectedYamlLink(item.label);
    setYamlLinkModalOpen(true);
  };

  const handleDeleteVersion = async () => {
    if (!item.label) { customAlert('No file selected.'); return; }
    const parts = item.label.split('/');
    const saasName = parts[parts.length - 2];
    const version = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    customConfirm(`Are you sure you want to delete ${saasName}-${version}?`).then(() => {
      removeDatasheetVersion(saasName, version)
        .then(() => customAlert(`${saasName}-${version} has been deleted.`).then(() => window.location.reload()))
        .catch(() => customAlert(`Failed to delete ${saasName}-${version}. Please, try again later or contact with support.`));
    });
  };

  const displayLabel = item.label.split('/').pop() || item.label;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-sphere-primary-100 hover:text-sphere-primary-700 group`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => hasChildren && toggleExpand(item.id)}
      >
        <span className="text-sm mr-1 flex-shrink-0">
          {hasChildren
            ? isExpanded ? <FaFolderOpen /> : <FaFolder />
            : getIconFromFileType(item.fileType)
          }
        </span>
        <span className="text-sm font-medium flex-1 truncate">{displayLabel}</span>
        {isDoc && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 rounded hover:bg-sphere-primary-200"
              onClick={e => { e.stopPropagation(); handleDownload(); }}
              title="Download"
            >
              <FiDownload size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-sphere-primary-200"
              onClick={e => { e.stopPropagation(); handleCopyLink(); }}
              title="Copy link"
            >
              <IoIosLink size={14} />
            </button>
            {authUser.user && pricingOwner === authUser.user.username && (
              <button
                className="p-1 rounded hover:bg-red-100 text-red-500"
                onClick={e => { e.stopPropagation(); handleDeleteVersion(); }}
                title="Delete"
              >
                <MdDeleteForever size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {hasChildren && (
        <AnimatedCollapse open={isExpanded}>
          <div className="border-l border-sphere-grey-300 ml-4">
            {item.children!.map(child => (
              <TreeNode
                key={child.id}
                item={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        </AnimatedCollapse>
      )}
    </div>
  );
}

export default function DatasheetFileExplorer({
  datasheetData,
}: {
  datasheetData: AnalyticsDataEntry[];
}) {
  const [items, setItems] = React.useState<TreeItem[]>([]);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(['root-files']));
  const [selectedYamlLink, setSelectedYamlLink] = React.useState<string>('');
  const [yamlLinkModalOpen, setYamlLinkModalOpen] = React.useState<boolean>(false);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  React.useEffect(() => {
    const datasheetItems = datasheetData.map((entry, index) => ({
      id: `datasheet-${index}`,
      label: entry.yaml,
      fileType: 'doc' as FileType,
    }));

    setItems([{
      id: 'root-files',
      label: 'Datasheets',
      fileType: 'folder',
      children: datasheetItems,
    }]);
  }, [datasheetData]);

  const contextValue = React.useMemo(() => ({
    pricingOwner:
      datasheetData.length > 0
        ? typeof datasheetData[0].owner === 'string' ? datasheetData[0].owner : datasheetData[0].owner.username
        : '',
    selectedYamlLink,
    setSelectedYamlLink,
    yamlLinkModalOpen,
    setYamlLinkModalOpen,
  }), [datasheetData, selectedYamlLink, yamlLinkModalOpen]);

  return (
    <FileExplorerContext.Provider value={contextValue}>
      <div className="flex flex-col w-full">
        <div className="flex justify-between p-4 border-b border-[#DFE3E8]">
          <h6 className="text-lg font-semibold">File Explorer</h6>
        </div>
        <div className="p-2">
          {items.map(item => (
            <TreeNode
              key={item.id}
              item={item}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      </div>

      {yamlLinkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setYamlLinkModalOpen(false)}
        >
          <div
            className="bg-white rounded-[20px] p-8 max-w-[600px] w-[90vw] shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-center mb-4">Your link is ready!</h2>
            <p className="text-center mt-4 mb-6">
              This link points directly to the YAML file of the selected datasheet version.
            </p>
            <div className="flex items-center">
              <CopyToClipboardIcon value={selectedYamlLink} />
            </div>
          </div>
        </div>
      )}
    </FileExplorerContext.Provider>
  );
}
