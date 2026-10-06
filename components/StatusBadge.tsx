export default function StatusBadge({value}:{value:string}){return <span className={`status s-${value.toLowerCase().replaceAll("_","-")}`}>{value.replaceAll("_"," ")}</span>}
