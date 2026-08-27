import { useParams } from "react-router";

const Workspace = () => {
  const params = useParams();
  if (!params) {
    return <div>invalid params</div>;
  }
  const workspaceId = params.id as string;
  if (!workspaceId) {
    return <div>invalid params</div>;
  }
  return <div>{workspaceId}</div>;
};

export default Workspace;
