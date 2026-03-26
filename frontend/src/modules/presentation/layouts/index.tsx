import { Box } from "@mui/material";
import Header from "./header";
import Main from "./main";
import Footer from "./components/footer";
import { useState } from "react";
import ImportPricingModal from "../../core/components/import-pricing-modal";
import ImportDatasheetModal from '../../core/components/import-datasheet-modal';
import { retrievePricingFromYaml } from "pricing4ts";
import Alerts from "../../core/components/alerts";
import { usePricingsApi } from "../../pricing/api/pricingsApi";
import { useAuth } from '../../auth/hooks/useAuth';

type ParsedDatasheetMeta = {
  saasName: string;
  version: string;
};

const sanitizeVersionSegment = (value: string) =>
  value.trim().replace(/[<>:"/\\|?*\u0000-\u001F\s]+/g, '_');

async function extractDatasheetMeta(file: File): Promise<ParsedDatasheetMeta> {
  const rawYaml = await file.text();
  const YAMLModule = await import('yaml');

  const parseYaml =
    (YAMLModule.parse as ((text: string) => Record<string, unknown>) | undefined) ||
    (YAMLModule.default?.parse as ((text: string) => Record<string, unknown>) | undefined);

  if (!parseYaml) {
    return { saasName: 'unknown-saas', version: `upload-${Date.now()}` };
  }

  const parsed = parseYaml(rawYaml);
  const saasName =
    ((parsed.associated_saas as string | undefined) ||
      (parsed.saasName as string | undefined) ||
      'unknown-saas')
      .toString()
      .trim();
  const rawVersion =
    ((parsed.date as string | undefined) ||
      (parsed.version as string | undefined) ||
      (parsed.syntax_version as string | undefined) ||
      `upload-${Date.now()}`)
      .toString()
      .trim();
  const version = sanitizeVersionSegment(rawVersion) || `upload-${Date.now()}`;

  return {
    saasName: saasName || 'unknown-saas',
    version: version || '0.0.0',
  };
}

export default function PresentationLayout({children}: {children?: React.ReactNode}){
    
    const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadDatasheetModalOpen, setUploadDatasheetModalOpen] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);

    const {createPricing} = usePricingsApi();
  const { fetchWithInterceptor, authUser } = useAuth();

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
      }

    const handleCloseUploadDatasheetModal = () => {
        setUploadDatasheetModalOpen(false);
      }
    
      const handleUploadSubmit = (file: File) => {
        file.text()
            .then(text => {
                try{
                    const uploadedPricing = retrievePricingFromYaml(text);
                    setErrors([]);
                    const formData = new FormData();
                    formData.append("saasName", uploadedPricing.saasName);
                    formData.append("version", uploadedPricing.version);
                    formData.append("yaml", file);
                    createPricing(formData, setErrors)
                      .then(() => {
                        setUploadModalOpen(false);
                      }).catch((error) => {
                        console.error('Error creating pricing:', error);
                      });
                }catch(e){
                    setErrors([(e as Error).message]);
                }
            })
      };

      const handleDatasheetUploadSubmit = (file: File) => {
        extractDatasheetMeta(file)
          .then(({ saasName, version }) => {
            const formData = new FormData();
            formData.append('saasName', saasName);
            formData.append('version', version);
            formData.append('yaml', file);

            return fetchWithInterceptor(`${import.meta.env.VITE_API_URL}/datasheets`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${authUser?.token}`,
              },
              body: formData,
            });
          })
          .then(async response => {
            const parsedResponse = await response.json();

            if (!response.ok) {
              throw new Error(parsedResponse.error);
            }

            setErrors([]);
            setUploadDatasheetModalOpen(false);
            return parsedResponse;
          })
          .catch((error: Error) => {
            setErrors([error.message]);
          });
      };
    
    return (
        <Box component="div" sx={{display: "grid", minHeight: "100dvh", gridTemplateRows: "auto 1fr"}}>
            <Header
              setUploadModalOpen={setUploadModalOpen}
              setUploadDatasheetModalOpen={setUploadDatasheetModalOpen}
            />
            <Main>{children}</Main>
            <Footer/>
            <ImportPricingModal modalState={uploadModalOpen} handleClose={handleCloseUploadModal} onSubmit={handleUploadSubmit}/>
            <ImportDatasheetModal
              modalState={uploadDatasheetModalOpen}
              handleClose={handleCloseUploadDatasheetModal}
              onSubmit={handleDatasheetUploadSubmit}
            />
            <Alerts messages={errors}/>
        </Box>
    );
}