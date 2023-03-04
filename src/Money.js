import config from "./config";



function Money(props) {
    return (
      <span>
            {config.moneyFormat(props.value)}
        </span>
    )
}

export default Money;