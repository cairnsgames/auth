import React, { createContext, useState } from "react";

type TenantType = {
  tenant: string
}
type TenantProviderType = {
  children: React.ReactNode
  application: string
}

// create context
const TenantContext = createContext<TenantType>({ tenant: "" });

const TenantProvider = ( props: TenantProviderType ) => {
  const { children } = props;

  if (!props.application) {
    throw new Error("TenantProvider: application prop is required");
  }

  const [tenant, ] = useState(props.application);

  return (
    // the Provider gives access to the context to its children
    <TenantContext.Provider value={{tenant}}>
      {children}
    </TenantContext.Provider>
  );
};

export { TenantContext, TenantProvider };