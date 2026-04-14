import { useEffect, useState } from 'react';
import { useMode } from '../../../core/hooks/useTheme';
import { primary } from '../../../core/theme/palette';
import ShortLogo from '../../../core/components/short-logo';
import Alerts from '../../../core/components/alerts';
import { StyledAppBar } from '../../../pricing-editor/layouts/components/styled-appbar';
import MobileHeaderItems from '../../../pricing-editor/layouts/components/mobile-header-items';
import DesktopHeaderItems from '../../../pricing-editor/layouts/components/desktop-header-items';
import { MenuItems } from '../../../pricing-editor/layouts/header';

interface DatasheetHeaderProps {
  editorValue: string;
  setEditorValue: (val: string) => void;
  renderSharedLink: () => void;
  renderYamlImport: () => void;
}

const DatasheetHeader = ({
  editorValue,
  setEditorValue,
  renderSharedLink,
  renderYamlImport,
}: DatasheetHeaderProps) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const { mode } = useMode();
  const [originalEditorValue, setOriginalEditorValue] = useState<string>('');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    setIsMobile(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const menuItems: MenuItems[] = [
    {
      name: 'File',
      disabled: false,
      children: [
        { name: 'New', disabled: false, onClick: () => setEditorValue(originalEditorValue) },
        { name: 'Import from YAML', disabled: false, onClick: renderYamlImport },
        { name: 'Clear Editor', disabled: false, onClick: () => setEditorValue('') },
      ],
    },
    {
      name: 'Export',
      disabled: false,
      children: [
        {
          name: 'Download YAML',
          disabled: false,
          onClick: () => {
            try {
              const blob = new Blob([editorValue], { type: 'text/yaml' });
              const url = URL.createObjectURL(blob);
              let fileName = 'datasheet.yml';
              const match = editorValue.match(/associated_saas:\s*(.+)/);
              if (match && match[1]) fileName = match[1].trim() + '-datasheet.yml';
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (e) {
              setErrors([...errors, (e as Error).message]);
              setTimeout(() => setErrors([]), 3000);
            }
          },
        },
        { name: 'Share Link', disabled: false, onClick: renderSharedLink },
      ],
    },
    {
      name: 'Documentation',
      disabled: false,
      onClick: () =>
        window.open(
          'https://pricing4saas-docs.vercel.app/docs/2.0.1/api/pricing-description-languages/Pricing2Yaml/pricing2yaml-v30-specification'
        ),
    },
  ];

  useEffect(() => {
    if (originalEditorValue === '' && editorValue !== '') {
      setOriginalEditorValue(editorValue);
    }
  }, [editorValue]);

  return (
    <>
      <StyledAppBar position="sticky" mode={mode}>
        <div style={{ marginLeft: 0 }} className="w-full px-4">
          <div className="flex items-center min-h-[64px]">
            <ShortLogo sx={{ fill: mode === 'light' ? primary[800] : primary[100] }} />
            {isMobile ? (
              <MobileHeaderItems menuItems={menuItems} />
            ) : (
              <DesktopHeaderItems menuItems={menuItems} />
            )}
          </div>
        </div>
      </StyledAppBar>
      <Alerts messages={errors} />
    </>
  );
};

export default DatasheetHeader;
