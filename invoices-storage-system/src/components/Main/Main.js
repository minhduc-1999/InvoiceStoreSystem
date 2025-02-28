import React, { useEffect, useState, useContext } from "react";
import DInvoice from "../../abis/Invoices.json";
import Web3 from "web3";
import "./Main.css";

import {
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Input,
  Alert,
} from "reactstrap";
import { Tooltip, Fab } from "@material-ui/core";
import { AuthContext } from "../../contexts/AuthProvider";
import { once } from "events";
const axios = require("axios");
const dateFormat = require("dateformat");

function Main() {
  const { logout, userAcc } = useContext(AuthContext);

  const [openInvoice, setOpenInvoice] = React.useState(false);
  const [openProfile, setOpenProfile] = React.useState(false);
  const [openNewInvoice, setOpenNewInvoice] = React.useState(false);
  const [openSearchInvoice, setOpenSearchInvoice] = useState(false);

  const [searchInvoiceId, setSearchInvoiceId] = useState("");

  //UserProfile Fields
  const [onChange, setOnChange] = useState(false);
  const [userName, setUserName] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [email, setEmail] = useState(null);
  const [address, setAddress] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [company, setCompany] = useState(null);
  const [failAlert, setFailAlert] = useState(false);

  //Invoice Fields
  const [receiverName, setReceiverName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverPhoneNumber, setReceiverPhoneNumber] = useState("");
  const [receiverCompany, setReceiverCompany] = useState("");

  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  const [detailList, setDetailList] = useState([]);
  const [onDetailListChange, setOnDetailListChange] = useState(false);

  const [dInvoice, setDInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [connecting, setConnecting] = useState(
    window.ethereum?.selectedAddress ? false : true
  );

  const [refreshInvoices, setRefreshInvoices] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [connected, setConnected] = useState(window.ethereum?.selectedAddress);

  //searchCombo-start
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [isDateSearch, setIsDateSearch] = useState(false);
  const [searchField, setSearchField] = useState("1");

  //searchCombo-end

  //modal noti
  const [showNoti, setShowNoti] = useState(false);
  const [txid, setTxid] = useState(null);
  const [showNotiAdd, setShowNotiAdd] = useState(false);

  useEffect(() => {
    getUser();
  }, [onChange]);

  useEffect(async () => {
    if (window.ethereum) {
      console.log("step 1");
      window.web3 = new Web3(window.ethereum);
      setConnecting(true);
      await window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((res) => {
          console.log("[enable]", res);
          setConnected(true);
          setConnecting(false);
          return true;
        })
        .then(() => {
          loadContract();
          setOnChange(!onChange);
        })
        .catch((err) => {
          console.error("err");
          setConnected(false);
          setConnecting(false);
          return false;
        });
    } else if (window.web3) {
      console.log("step 2");
      window.web3 = new Web3(window.web3.currentProvider);
      setConnected(true);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }, []);

  useEffect(() => {
    setDetailList(detailList);
  }, [onDetailListChange]);

  useEffect(() => {
    console.log("[REFRESH]");
    loadContract();
  }, [refreshInvoices]);

  useEffect(() => {
    if (selectedInvoice !== null) {
      console.log(selectedInvoice);
      setOpenInvoice(true);
    }
  }, [selectedInvoice]);

  const connectEther = async () => {
    setConnecting(true);
    await window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then((res) => {
        console.log("[enable]", res);
        setConnected(true);
        setConnecting(false);
        return true;
      })
      .then(() => {
        loadContract();
      })
      .catch((err) => {
        // console.error(err);
        setConnected(false);
        setConnecting(false);
        return false;
      });
  };

  const loadContract = async () => {
    const web3 = window.web3;
    //Load accounts
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
    //Add first account the the state
    setAccount(accounts[0]);
    //Get network ID
    const networkId = await web3.eth.net.getId();
    //Get network data
    const networkData = DInvoice.networks[networkId];
    if (networkData) {
      const invoice = new web3.eth.Contract(DInvoice.abi, networkData.address);
      // console.log("[INVOICE NE]", invoice);
      // this.setState({ invoice });
      setDInvoice(invoice);
      //console.log("use id", userAcc.userId);
      invoice.methods
        .GetInvoices(userAcc.userId)
        .call()
        .then((result) => {
          //console.log(result);
          const temp = result.map((bill) => {
            return {
              numberId: bill._numberId,
              sender: {
                name: bill._sender._name,
                address: bill._sender._address,
                phone: bill._sender._phone,
                company: bill._sender._company,
                email: bill._sender._email,
              },
              receiver: {
                name: bill._receiver._name,
                address: bill._receiver._address,
                phone: bill._receiver._phone,
                company: bill._receiver._company,
                email: bill._receiver._email,
              },
              discount: bill._discount,
              tax: bill._tax,
              total: bill._total,
              details: JSON.parse(bill._details),
              author: bill._author,
              createAt: new Date(Number(bill._createAt)),
            };
          });
          setInvoices(temp);
          //console.log(temp);
        });
      // this.setState({ loading: false });
      setLoading(false);
    } else {
      window.alert("DInvoice contract not deployed to detected network");
    }
  };

  const getContractByInvoiceId = async (invoiceId) => {
    dInvoice.methods
      .invoices(Number(invoiceId))
      .call()
      .then((rs) => {
        const temp = {
          numberId: rs._numberId,
          sender: {
            name: rs._sender._name,
            address: rs._sender._address,
            phone: rs._sender._phone,
            company: rs._sender._company,
            email: rs._sender._email,
          },
          receiver: {
            name: rs._receiver._name,
            address: rs._receiver._address,
            phone: rs._receiver._phone,
            company: rs._receiver._company,
            email: rs._receiver._email,
          },
          discount: rs._discount,
          tax: rs._tax,
          total: rs._total,
          details: JSON.parse(rs._details),
          author: rs._author,
          createAt: new Date(Number(rs._createAt)),
        };
        //console.log(temp);
        setSelectedInvoice(temp);
      })
      .catch(() => {
        window.alert(
          "Can't find a valid invoice\nPlease check the invoice code again"
        );
      });
  };

  const getSearchField = (e) => {
    setSearchResult([]);
    setSearchTerm("");
    setSearchField(e.target.value);
    if (e.target.value === "2") {
      var today = new Date();
      var currentDate = today.toISOString().substring(0, 10);
      document.getElementById("searchDate").value = currentDate;
      setIsDateSearch(true);
      filterInvoiceByDate(document.getElementById("searchDate").value);
    } else {
      setIsDateSearch(false);
    }
  };

  const filterInvoiceByDate = (date) => {
    if (date !== null) {
      const newInvoiceList = invoices.filter((bill) => {
        return (
          dateFormat(Object.values(bill)[3].createAt, "dd/mm/yyyy") ===
          dateFormat(date, "dd/mm/yyyy")
        );
      });
      setSearchResult(newInvoiceList);
    } else {
      setSearchResult(invoices);
    }
  };

  const getSearchTerm = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value !== "") {
      console.log(e.target.value);
      let newInvoiceList = [];
      switch (searchField) {
        case "1":
          newInvoiceList = invoices.filter((bill) => {
            return ("HD" + bill.numberId.toString())
              .toLowerCase()
              .includes(e.target.value.toLowerCase());
          });
          break;
        case "3":
          newInvoiceList = invoices.filter((bill) => {
            return (bill.sender.name + "")
              .toLowerCase()
              .includes(e.target.value.toLowerCase());
          });
          break;
        case "4":
          newInvoiceList = invoices.filter((bill) => {
            return (bill.receiver.name + "")
              .toLowerCase()
              .includes(e.target.value.toLowerCase());
          });
          break;
        case "5":
          newInvoiceList = invoices.filter((bill) => {
            return (bill.total + "").includes(e.target.value);
          });
          break;

        default:
          break;
      }
      setSearchResult(newInvoiceList);
    } else {
      setSearchResult(invoices);
    }
  };

  const renderInvoices = () =>
    (searchTerm.length < 1 && searchField !== "2"
      ? invoices
      : searchResult
    ).map((invoice, index) => (
      <tr
        key={index}
        onDoubleClick={() => {
          handleClickOpenInvoice(invoice);
        }}
      >
        <td scope="row">{index + 1}</td>
        <td>HD{invoice.numberId.toString()}</td>
        {/* <td>{invoice.txid.toString()}</td> */}
        <td>{dateFormat(invoice.createAt, "dd/mm/yyyy")}</td>
        <td>{invoice.sender.name}</td>
        <td>{invoice.receiver.name}</td>
        <td>{invoice.total} VNĐ</td>
      </tr>
    ));

  const getUser = () => {
    let loginToken = localStorage.getItem("LoginToken");
    let userId = localStorage.getItem("UserId");
    axios
      .get(process.env.REACT_APP_BASE_URL + "users", {
        params: {
          id: userId,
        },
        headers: {
          Authorization: "Bearer " + loginToken,
        },
      })
      .then((response) => {
        return response.data;
      })
      .then((data) => {
        setUserName(userAcc.username);
        setFullName(data.claims.name);
        setEmail(data.claims.email);
        setPhoneNumber(data.claims.phoneNumber);
        setAddress(data.claims.address);
        setCompany(data.claims.company);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const updateUser = () => {
    let loginToken = localStorage.getItem("LoginToken");
    let userId = localStorage.getItem("UserId");
    let newUserClaim = {
      updateClaim: {
        address: address,
        phoneNumber: phoneNumber,
        email: email,
        company: company,
        name: fullName,
      },
    };
    axios
      .put(process.env.REACT_APP_BASE_URL + "users", newUserClaim, {
        params: {
          id: userId,
        },
        headers: {
          Authorization: "Bearer " + loginToken,
        },
      })
      .then((response) => {
        setOnChange(!onChange);
        closeUserProfile();
      })
      .catch((error) => {
        console.log(error);
        setFailAlert(true);
      });
  };

  const ColoredLine = ({ color }) => (
    <hr
      style={{
        color: color,
        backgroundColor: color,
        height: 1,
      }}
    />
  );

  const handleClickOpenInvoice = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
    setOpenInvoice(false);
  };

  const createNewInvoice = () => {
    if (
      detailList.length < 1 ||
      email === null ||
      fullName === null ||
      address === null ||
      phoneNumber === null ||
      company === null ||
      receiverName === "" ||
      receiverAddress === "" ||
      receiverPhoneNumber === "" ||
      receiverEmail === "" ||
      receiverCompany === "" ||
      discount === "" ||
      tax === ""
    ) {
      console.log("[KO DUOC LUU]");
    } else {
      console.log("[DUOC LUU]");
      const sender = {
        _name: fullName,
        _address: address,
        _phone: phoneNumber,
        _company: company,
        _email: email,
      };
      const receiver = {
        _name: receiverName,
        _address: receiverAddress,
        _phone: receiverPhoneNumber,
        _company: receiverCompany,
        _email: receiverEmail,
      };
      dInvoice.once("InvoiceUploaded", (err, event) => {
        if (!err) {
          console.log("Mined", event);
          setShowNoti(true);
          setTxid(event.transactionHash);
          setShowNotiAdd(false);
          const temp = {
            numberId: event.returnValues._numberId,
            sender: {
              name: event.returnValues._sender._name,
              address: event.returnValues._sender._address,
              phone: event.returnValues._sender._phone,
              company: event.returnValues._sender._company,
              email: event.returnValues._sender._email,
            },
            receiver: {
              name: event.returnValues._receiver._name,
              address: event.returnValues._receiver._address,
              phone: event.returnValues._receiver._phone,
              company: event.returnValues._receiver._company,
              email: event.returnValues._receiver._email,
            },
            discount: event.returnValues._discount,
            tax: event.returnValues._tax,
            total: event.returnValues._total,
            details: JSON.parse(event.returnValues._details),
            author: event.returnValues._author,
            createAt: new Date(Number(event.returnValues._createAt)),
          };
          setInvoices([...invoices, temp]);
        }
      });
      dInvoice.methods
        .uploadInvoice(
          userAcc.userId,
          sender,
          receiver,
          discount.toString(),
          tax.toString(),
          calcInvoicePrice().toString(),
          JSON.stringify(detailList),
          Date.now().toString()
        )
        .send({ from: account })
        // .on("confirmation", (confirm, receipt, lastestBlockHash) => {
        //   console.log("[Number comfirm]", confirm);
        //   console.log("[Receipt comfirm]", receipt);
        //   console.log("[lastestBlockHash]", lastestBlockHash);
        //   setLoading(false);
        //   setRefreshInvoices(!refreshInvoices);
        //   handleCloseNewInvoice();
        // });
        .once("transactionHash", (hash) => {
          console.log("[HASH NE]", hash);
          setLoading(false);
          setRefreshInvoices(!refreshInvoices);
          handleCloseNewInvoice();
          setShowNotiAdd(true);
        });
      // handleCloseNewInvoice();
      // setShowNotiAdd(true);
      // setTimeout(async () => {
      //   setShowNotiAdd(false);
      // }, 2000);
    }
  };

  const handleUpdateProfile = () => {
    setFailAlert(false);
    updateUser();
  };

  const openUserProfile = () => {
    setOpenProfile(!openProfile);
  };

  const closeUserProfile = () => {
    setOnChange(!onChange);
    setOpenProfile(!openProfile);
  };

  const onDismissFail = () => setFailAlert(!failAlert);

  const handleClickOpenNewInvoice = () => {
    setOpenNewInvoice(true);
  };

  const handleCloseNewInvoice = () => {
    setReceiverAddress("");
    setReceiverCompany("");
    setReceiverName("");
    setReceiverPhoneNumber("");
    setReceiverEmail("");
    setDetailList([]);
    setDescription("");
    setQuantity(0);
    setUnitPrice(0);
    setDiscount(0);
    setTax(0);
    setOpenNewInvoice(false);
  };

  const addDetailToTable = () => {
    if (description === "" || Number(quantity) <= 0 || Number(unitPrice) < 0) {
      console.log("[KO DUOC THEM VAO BANG]");
    } else {
      console.log("[DUOC THEM VAO BANG]");
      let tempPrice = Number(quantity) * Number(unitPrice);
      setDetailList([
        ...detailList,
        {
          description: description,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          price: tempPrice,
        },
      ]);
      setDescription("");
      setQuantity(0);
      setUnitPrice(0);
    }
  };

  const removeDetailFromTable = (index) => {
    detailList.splice(index, 1);
    setOnDetailListChange(!onDetailListChange);
  };

  const calcInvoicePrice = () => {
    if (detailList.length > 0) {
      let total = 0;
      detailList.map((detail) => {
        total += Number(detail.price);
      });
      if (discount !== 0) {
        total *= Number((100 - Number(discount)) / 100);
      }
      if (tax !== 0) {
        total *= Number((100 + Number(tax)) / 100);
      }
      return total.toFixed(2);
    } else {
      return 0;
    }
  };

  return (
    <>
      <div>
        <Row>
          <Card>
            <CardHeader style={{ marginLeft: 20 }}>
              <Row>
                <Col>
                  <CardTitle tag="h3" style={{ fontWeight: "bold" }}>
                    Danh sách hóa đơn
                  </CardTitle>
                </Col>
                <Col md="auto">
                  <CardTitle
                    tag="h4"
                    style={{ marginTop: 15, marginRight: -20 }}
                  >
                    {fullName}
                  </CardTitle>
                </Col>
                <Col md="auto">
                  <UncontrolledDropdown style={{ marginRight: 10 }}>
                    <DropdownToggle
                      caret
                      color="default"
                      nav
                      onClick={(e) => e.preventDefault()}
                    >
                      <div className="photo">
                        <img
                          height="40"
                          width="40"
                          alt="..."
                          src={require("assets/img/anime3.png").default}
                        />
                      </div>
                    </DropdownToggle>
                    <DropdownMenu className="dropdown-navbar" right tag="ul">
                      <DropdownItem
                        onClick={openUserProfile}
                        className="nav-item"
                      >
                        Thông tin
                      </DropdownItem>
                      <DropdownItem divider tag="li" />
                      <DropdownItem onClick={logout} className="nav-item">
                        Đăng xuất
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </Col>
              </Row>
              <Row>
                <Col md="2">
                  <Input
                    //value={searchTerm}
                    type="select"
                    defaultValue={"1"}
                    onChange={(e) => getSearchField(e)}
                  >
                    <option value="1">Hóa đơn số</option>
                    <option value="2">Ngày giao dịch</option>
                    <option value="3">Người gửi</option>
                    <option value="4">Người nhận</option>
                    <option value="5">Tổng tiền</option>
                  </Input>
                </Col>
                <Col md="3" hidden={isDateSearch}>
                  <Input
                    value={searchTerm}
                    type="text"
                    placeholder="Nội dung tìm kiếm"
                    onChange={(e) => getSearchTerm(e)}
                  />
                </Col>
                <Col md="3" hidden={!isDateSearch}>
                  <Input
                    id="searchDate"
                    type="date"
                    onChange={(e) => filterInvoiceByDate(e.target.value)}
                  />
                </Col>
                <Col md="3" />
                <Col md="2">
                  <Button
                    className="btn-fill"
                    color="primary"
                    type="submit"
                    style={{ marginTop: 0 }}
                    onClick={() => {
                      setSearchInvoiceId("");
                      setOpenSearchInvoice(true);
                    }}
                  >
                    Tìm hóa đơn
                  </Button>
                </Col>
                <Col md="2">
                  <Button
                    className="btn-fill"
                    color="primary"
                    type="submit"
                    style={{ marginTop: 0 }}
                    onClick={handleClickOpenNewInvoice}
                  >
                    Hóa đơn mới
                  </Button>
                </Col>
              </Row>
            </CardHeader>
            {connected ? (
              <CardBody style={{ margin: 10 }}>
                {renderInvoices().length <= 0 ? (
                  <p style={{ fontSize: 20, marginLeft: 10 }}>
                    Không tìm thấy hóa đơn phù hợp
                  </p>
                ) : (
                  <table className="table">
                    <thead className="text-primary">
                      <tr>
                        <th>STT</th>
                        <th>Hóa đơn số</th>
                        {/* <th>TXID</th> */}
                        <th>Ngày tạo</th>
                        <th>Người gửi</th>
                        <th>Người nhận</th>
                        <th>Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>{renderInvoices()}</tbody>
                  </table>
                )}
              </CardBody>
            ) : (
              <div className="connectRequire">
                <h3 id="suggest-text">
                  You need an wallet to use our service. You should consider
                  trying MetaMask!
                </h3>
                <Button
                  className="btn-fill"
                  color="primary"
                  disabled={connecting}
                  style={{ marginTop: 0 }}
                  onClick={() => {
                    connectEther();
                  }}
                >
                  Connect to your wallet
                </Button>
              </div>
            )}
          </Card>
        </Row>

        <Modal isOpen={openInvoice} size="lg">
          <ModalHeader style={{ margin: 25, justifyContent: "center" }}>
            <h3 style={{ fontSize: 25, fontWeight: "bold" }}>Hóa đơn</h3>
          </ModalHeader>
          <ModalBody>
            {selectedInvoice === null ? (
              <div hidden="true"></div>
            ) : (
              <div>
                <Row>
                  <Col md="3">
                    <h4 className="title">Ngày giao dịch:</h4>
                  </Col>
                  <Col>
                    <h4>
                      {selectedInvoice &&
                        dateFormat(selectedInvoice.createAt, "dd/mm/yyyy")}
                    </h4>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <h4 className="title">Người gửi:</h4>
                  </Col>
                  <Col md="6">
                    <h4 className="title">Người nhận:</h4>
                  </Col>
                </Row>
                <Row>
                  <Col md="3">
                    <h5>Họ và Tên:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.sender.name}</h5>
                  </Col>
                  <Col md="3">
                    <h5>Họ và Tên:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.receiver.name}</h5>
                  </Col>
                </Row>
                <Row>
                  <Col md="3">
                    <h5>Số điện thoại:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.sender.phone}</h5>
                  </Col>
                  <Col md="3">
                    <h5>Số điện thoại:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.receiver.phone}</h5>
                  </Col>
                </Row>
                <Row>
                  <Col md="3">
                    <h5>Công ty:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.sender.company}</h5>
                  </Col>
                  <Col md="3">
                    <h5>Công ty:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.receiver.company}</h5>
                  </Col>
                </Row>
                <Row>
                  <Col md="3">
                    <h5>Email:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.sender.email}</h5>
                  </Col>
                  <Col md="3">
                    <h5>Email:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.receiver.email}</h5>
                  </Col>
                </Row>
                <Row>
                  <Col md="3">
                    <h5>Địa chỉ:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.sender.address}</h5>
                  </Col>
                  <Col md="3">
                    <h5>Địa chỉ:</h5>
                  </Col>
                  <Col md="3">
                    <h5>{selectedInvoice.receiver.address}</h5>
                  </Col>
                </Row>
              </div>
            )}
            <ColoredLine color="gray" />
            <Row>
              <Card>
                <CardHeader>
                  <Row>
                    <Col>
                      <h4 className="title">Chi tiết hóa đơn</h4>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <table class="table" responsive>
                    <thead className="text-primary">
                      <tr>
                        <th>STT</th>
                        <th>Chi tiết</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice !== null &&
                        selectedInvoice.details.map((detail, index) => (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>{detail.description}</td>
                            <td>{detail.quantity}</td>
                            <td>{detail.unitPrice} VNĐ</td>
                            <td>{detail.price} VNĐ</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Row>
            {selectedInvoice !== null &&
              (selectedInvoice.discount !== "0" ||
                selectedInvoice.tax !== "0") && (
                <div>
                  <ColoredLine color="gray" />
                  <Row>
                    <Col>
                      <h4 className="title">Các khoản phí khác</h4>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="3">
                      <h5>Discount:</h5>
                    </Col>
                    <Col md="3">
                      <h5>{selectedInvoice.discount} %</h5>
                    </Col>
                    <Col md="3">
                      <h5>Tax:</h5>
                    </Col>
                    <Col md="3">
                      <h5>{selectedInvoice.tax} %</h5>
                    </Col>
                  </Row>
                </div>
              )}
            <ColoredLine color="gray" />
            <Row>
              <Col>
                <h4 className="title">Thành tiền</h4>
              </Col>
              <Col md="auto">
                <h4 className="title">
                  {selectedInvoice !== null && selectedInvoice.total} VNĐ
                </h4>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter style={{ margin: 5, justifyContent: "flex-end" }}>
            <Button
              onClick={handleCloseInvoice}
              className="btn-fill"
              color="primary"
              type="submit"
            >
              OK
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={openProfile} size="lg">
          <ModalHeader>
            <p style={{ fontSize: 25 }} className="title">
              Chỉnh sửa hồ sơ
            </p>
          </ModalHeader>
          <ModalBody>
            <Form>
              <Row>
                <Col className="pr-md-1" md="6">
                  <FormGroup>
                    <label>Username</label>
                    <Input
                      value={userName}
                      placeholder="Username"
                      disabled
                      type="text"
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col className="pr-md-1" md="6">
                  <FormGroup>
                    <label>Họ và Tên</label>
                    <Input
                      value={fullName}
                      placeholder="Họ và Tên"
                      type="text"
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col className="pl-md-1" md="6">
                  <FormGroup>
                    <label>Số điện thoại</label>
                    <Input
                      value={phoneNumber}
                      placeholder="Số điện thoại"
                      type="number"
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col className="pr-md-1" md="6">
                  <FormGroup>
                    <label>Công ty</label>
                    <Input
                      value={company}
                      placeholder="Công ty"
                      type="text"
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col className="pl-md-1" md="6">
                  <FormGroup>
                    <label htmlFor="exampleInputEmail1">Địa chỉ email</label>
                    <Input
                      value={email}
                      placeholder="Email"
                      type="email"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col className="pl-md-1">
                  <FormGroup style={{ marginLeft: 10 }}>
                    <label>Địa chỉ</label>
                    <Input
                      value={address}
                      placeholder="Địa chỉ thường trú"
                      type="text"
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Form>
            <Alert
              className="alert-error"
              color="warning"
              isOpen={failAlert}
              toggle={onDismissFail}
            >
              Cập nhật thông tin thất bại.
            </Alert>
          </ModalBody>
          <ModalFooter style={{ marginRight: 10, justifyContent: "flex-end" }}>
            <Button
              className="btn-fill"
              color="primary"
              type="submit"
              style={{ marginRight: 10 }}
              onClick={closeUserProfile}
            >
              Hủy
            </Button>
            <Button
              className="btn-fill"
              color="primary"
              type="submit"
              onClick={handleUpdateProfile}
            >
              Cập nhật
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={openNewInvoice} size="lg">
          <ModalHeader style={{ justifyContent: "center" }}>
            <p style={{ fontSize: 25, fontWeight: "bold" }} className="title">
              Hóa đơn mới
            </p>
          </ModalHeader>
          <ModalBody>
            <Form>
              <Row>
                <Col>
                  <FormGroup>
                    <h4 style={{ fontWeight: "bold" }}>Thông tin người nhận</h4>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="8">
                  <FormGroup>
                    <label>Họ và Tên</label>
                    <Input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <label>Số điện thoại</label>
                    <Input
                      type="number"
                      value={receiverPhoneNumber}
                      onChange={(e) => setReceiverPhoneNumber(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="4">
                  <FormGroup>
                    <label>Công ty</label>
                    <Input
                      type="text"
                      value={receiverCompany}
                      onChange={(e) => setReceiverCompany(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="8">
                  <FormGroup>
                    <label>Email</label>
                    <Input
                      type="email"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col>
                  <FormGroup>
                    <label>Địa chỉ</label>
                    <Input
                      type="text"
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <ColoredLine color="grey" />
              <Row>
                <Col>
                  <FormGroup>
                    <h4 style={{ fontWeight: "bold" }}>Chi tiết hóa đơn</h4>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Row>
                    <Col md="5">
                      <label>Chi tiết</label>
                    </Col>
                    <Col md="3">
                      <label>Đơn giá (VNĐ)</label>
                    </Col>
                    <Col md="3">
                      <label>Số lượng</label>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row>
                <Col md="5">
                  <FormGroup>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="1" style={{ alignItems: "flex-end", display: "flex" }}>
                  <Tooltip title="Thêm">
                    <Fab
                      size="small"
                      style={{ marginBottom: 10 }}
                      onClick={addDetailToTable}
                    >
                      <i className="tim-icons icon-simple-add"></i>
                    </Fab>
                  </Tooltip>
                </Col>
              </Row>
              <ColoredLine color="grey" />
              <table className="table">
                <thead className="text-primary">
                  <tr>
                    <th>ID</th>
                    <th>Chi tiết</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detailList.length < 1 ? (
                    <div hidden={true}></div>
                  ) : (
                    detailList.map((detail, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td>{detail.description}</td>
                        <td>{detail.unitPrice}</td>
                        <td>{detail.quantity}</td>
                        <td>{detail.price}</td>
                        <Fab
                          size="small"
                          onClick={() => {
                            removeDetailFromTable(index);
                          }}
                        >
                          <i className="tim-icons icon-simple-delete"></i>
                        </Fab>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <ColoredLine color="grey" />
              <Row>
                <Col>
                  <FormGroup>
                    <h4 style={{ fontWeight: "bold" }}>Các khoản khác</h4>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col>
                  <FormGroup>
                    <label>Discount (%)</label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col>
                  <FormGroup>
                    <label>Tax (%)</label>
                    <Input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <ColoredLine color="grey" />
              <Row>
                <Col>
                  <FormGroup>
                    <h4 style={{ fontWeight: "bold" }}>Tổng cộng</h4>
                  </FormGroup>
                </Col>
                <Row>
                  <Col md="auto" style={{ marginRight: 25 }}>
                    <h3 className="title">{calcInvoicePrice()} VNĐ</h3>
                  </Col>
                </Row>
              </Row>
            </Form>
          </ModalBody>
          <ModalFooter style={{ margin: 10, justifyContent: "flex-end" }}>
            <Button
              onClick={handleCloseNewInvoice}
              className="btn-fill"
              color="primary"
              type="submit"
              style={{ marginRight: 20 }}
            >
              Hủy
            </Button>
            <Button
              onClick={createNewInvoice}
              className="btn-fill"
              color="primary"
              type="submit"
            >
              Lưu
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={openSearchInvoice} size="sm">
          <ModalHeader style={{ justifyContent: "center" }}>
            <p style={{ fontSize: 25, fontWeight: "bold" }} className="title">
              Tìm hóa đơn
            </p>
          </ModalHeader>
          <ModalBody>
            <Form>
              <Row>
                <Col md="auto">
                  <label style={{ fontSize: 20 }}>HD</label>
                </Col>
                <Col>
                  <FormGroup>
                    <Input
                      type="text"
                      placeholder="Nội dung tìm kiếm"
                      value={searchInvoiceId}
                      onChange={(e) =>
                        setSearchInvoiceId(e.target.value.replace(/^\D+/g, ""))
                      }
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Form>
          </ModalBody>
          <ModalFooter style={{ margin: 10, justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setOpenSearchInvoice(false);
              }}
              className="btn-fill"
              color="primary"
              type="submit"
              style={{ marginRight: 20 }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (searchInvoiceId !== "") {
                  getContractByInvoiceId(Number(searchInvoiceId));
                }
              }}
              className="btn-fill"
              color="primary"
              type="submit"
            >
              Tìm kiếm
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={showNoti} size="lg" id="notiModal">
          <ModalHeader style={{ justifyContent: "center", display: "flex" }}>
            <p
              style={{
                fontSize: 20,
                fontWeight: "normal",
                textAlign: "center",
                lineHeight: "25px",
              }}
              className="title"
            >
              <p
                style={{
                  fontSize: 25,
                  color: "#39cf1b",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                Giao dịch thành công
              </p>{" "}
              Mã giao dịch của bạn là{" "}
              <p
                style={{
                  display: "inline",
                  fontSize: 20,
                  fontWeight: "normal",
                  textAlign: "center",
                  lineHeight: "25px",
                  color: "#ced197",
                }}
              >
                {txid}
              </p>{" "}
              Xem giao dịch{" "}
              <a
                target="_blank"
                href={`https://ropsten.etherscan.io/tx/${txid}`}
              >
                tại đây
              </a>
            </p>
          </ModalHeader>
          <ModalFooter style={{ margin: 10, justifyContent: "center" }}>
            <Button
              onClick={() => {
                setShowNoti(false);
                setTxid(null);
              }}
              className="btn-fill"
              color="primary"
              type="submit"
            >
              OK
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={showNotiAdd} size="sm" id="notiModal">
          <ModalHeader style={{ justifyContent: "center", display: "flex" }}>
            <p
              style={{
                fontSize: 20,
                fontWeight: "normal",
                textAlign: "center",
                lineHeight: "25px",
              }}
              className="title"
            >
              <p
                style={{
                  fontSize: 25,
                  color: "#39cf1b",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                Thành công
              </p>{" "}
              Hoá đơn của bạn đang được xử lý, vui lòng chờ trong giây lát...{" "}
            </p>
          </ModalHeader>
          <ModalFooter style={{ margin: 10, justifyContent: "center" }}>
            <Button
              onClick={() => {
                setShowNotiAdd(false);
              }}
              className="btn-fill"
              color="primary"
              type="submit"
            >
              OK
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
}

export default Main;
