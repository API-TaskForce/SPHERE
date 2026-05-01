import Header from "./header";
import Main from "./main";
import Footer from "./components/footer";
import { useState } from "react";
import ImportPricingModal from "../../core/components/import-pricing-modal";
import { retrievePricingFromYaml } from "pricing4ts";
import Alerts from "../../core/components/alerts";
import { usePricingsApi } from "../../pricing/api/pricingsApi";
import { useSpaceClient } from "space-react-client";
import { useOrganization } from "../../organization/hooks/useOrganization";

export default function PresentationLayout({children}: {children?: React.ReactNode}){
    
    const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);

    const {createPricing} = usePricingsApi();
    const spaceClient = useSpaceClient();
    const { activeOrganization } = useOrganization();

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
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
                        if (activeOrganization?.id) {
                          spaceClient.setUserId(activeOrganization.id).catch(() => {});
                        }
                        setUploadModalOpen(false);
                      }).catch((error) => {
                        console.error('Error creating pricing:', error);
                      });
                }catch(e){
                    setErrors([(e as Error).message]);
                }
            })
      };
    
    return (
      <div className="grid min-h-dvh grid-rows-[auto_1fr]">
            <Header setUploadModalOpen={setUploadModalOpen}/>
            <Main>{children}</Main>
            <Footer/>
            <ImportPricingModal modalState={uploadModalOpen} handleClose={handleCloseUploadModal} onSubmit={handleUploadSubmit}/>
            <Alerts messages={errors}/>
      </div>
    );
}