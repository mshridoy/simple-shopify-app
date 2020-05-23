import React, { useEffect, useCallback, useState } from "react";
import cookie from "cookie";
import {
  Page,
  Card,
  Toast,
  SettingToggle,
  TextStyle,
  TextField,
  Frame,
} from "@shopify/polaris";

import { Provider, TitleBar } from "@shopify/app-bridge-react";

import axios from "axios";

import UnAuthUser from "./UnAuthUser";

function App() {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");
  const [toast, setToast] = useState(false);
  const { shopName, apiKey, accessToken } = cookie.parse(document.cookie);

  const decodedShopName = atob(shopName || "");
  const decodedApiKey = atob(apiKey || "");
  const decodedAccessToken = atob(accessToken || "");

  const handleToggle = useCallback(async () => {
    try {
      if (active) {
        // call for delete script tag
        setToast("Deleting Script Tag...");
        await axios.post("delete_script_tag", {
          shopName: decodedShopName,
          accessToken: decodedAccessToken,
        });
        setToast("Script Tag Deleted!");
      } else {
        // call for create script tag

        setToast("Creating Script Tag...");
        await axios.post("create_script_tag", {
          shopName: decodedShopName,
          accessToken: decodedAccessToken,
        });
        setToast("Script Tag Created!");
      }
      setActive((active) => !active);
    } catch (err) {
      console.log(err);
    }
  }, [active, decodedAccessToken, decodedShopName]);
  const handleChange = useCallback((newValue) => setValue(newValue), []);

  useEffect(() => {
    axios
      .post("/get_existing_result", { shopName: decodedShopName })
      .then(({ data }) => {
        const { result } = data;
        setValue(result.value);
        setActive(result.scriptTagId);
      })
      .catch((err) => console.log(err));
  }, [decodedShopName]);

  const contentStatus = active ? "Disable" : "Enable";
  const textStatus = active ? "enabled" : "disabled";

  const saveButtonHandler = () => {
    setToast("Data Saving...");
    axios
      .post("/save_value", {
        value,
        shopName: decodedShopName,
      })
      .then(({ data }) => {
        setToast("Data Saved!");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (!decodedShopName || !decodedApiKey || !decodedAccessToken) {
    return <UnAuthUser />;
  }
  return (
    <Frame>
      {toast && <Toast content={toast} onDismiss={() => setToast(false)} />}
      <Page>
        <Provider
          config={{
            apiKey: decodedApiKey,
            shopOrigin: decodedShopName,
          }}
        >
          <TitleBar
            title="Home"
            secondaryActions={[
              {
                content: "Home",
              },
            ]}
          />
        </Provider>
        <SettingToggle
          action={{
            content: contentStatus,
            onAction: handleToggle,
          }}
          enabled={active}
        >
          App is currently{" "}
          <TextStyle variation="strong">{textStatus}</TextStyle>.
        </SettingToggle>
        <Card
          title="Settings"
          primaryFooterAction={{ content: "Save", onAction: saveButtonHandler }}
        >
          <Card.Section>
            <TextField
              label="Example Value"
              value={value}
              placeholder="Enter a value here"
              onChange={handleChange}
            />
          </Card.Section>
        </Card>
      </Page>
    </Frame>
  );
}

export default App;
