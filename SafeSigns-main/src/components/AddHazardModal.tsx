import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Grid,
  TextField,
  Box,
  Card,
  CardMedia,
  CardContent,
  styled,
  useMediaQuery,
  InputAdornment,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Close,
  ArrowBack,
  ArrowForward,
  Check,
  AddPhotoAlternate,
  Send,
  Delete as DeleteIcon,
  PhotoLibrary,
  ErrorOutline,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import esriRequest from "@arcgis/core/request";

const MAX_DESCRIPTION_CHARS = 250;

interface HazardData {
  category: string;
  subcategory: string;
  description: string;
  date: string;
  media: File[];
}

interface LayerInfo {
  id: number;
  name: string;
  url: string;
}

interface AddHazardModalProps {
  isOpen: boolean;
  allLayers: LayerInfo[];
  onHazardDataChange: (data: HazardData) => void;
  onSubmitHazard: (hazardData: HazardData) => void;
  resetHazardData: () => void;
  onClose: () => void;
}

const steps = [
  "Hazard",
  "Type",
  "Description",
  "Media",
  "Review",
  "Confirmation",
];

const stepTitles: {
  [key: number]: string | ((selectedCategory?: string) => string);
} = {
  0: "What Hazard Did You See?",
  1: (selectedCategory?: string) =>
    `What Type of "${selectedCategory}" Hazard?`,
  2: "Please Describe the Hazard (Optional)",
  3: "Add Media (Optional)",
  4: "Review Your Hazard Report",
  5: "Submission Completed (Thank You!)",
};

const ResponsiveStepper = styled(Stepper)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    "& .MuiStep-root": {
      display: "none",
      "&.active": {
        display: "block",
      },
    },
  },
}));

const AddHazardModal: React.FC<AddHazardModalProps> = ({
  isOpen,
  onClose,
  onHazardDataChange,
  allLayers,
  onSubmitHazard,
}) => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const [activeStep, setActiveStep] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [hazardSubcategories, setHazardSubcategories] = useState<
    { name: string; code: string }[]
  >([]);

  const [loadedHazardIcon, setLoadedHazardIcon] = useState<
    Record<string, boolean>
  >({});

  const [errorMessage, setErrorMessage] = useState("");

  const handleHazardIconLoad = (name: string) => {
    setLoadedHazardIcon((prev) => ({ ...prev, [name]: true }));
  };

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    return `${month}/${day}/${year}, ${formattedHours}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };

  const getStepTitle = (step: number) => {
    const title = stepTitles[step];
    if (typeof title === "function") {
      return title(hazardData.category);
    }
    return title || `Step ${step}`;
  };

  const [hazardData, setHazardData] = useState<HazardData>({
    category: "",
    subcategory: "",
    description: "",
    date: formatDate(new Date()),
    media: [],
  });

  const hazardLayers = useMemo(() => {
    const neededIds = [1, 2, 3, 4, 5];
    return allLayers.filter((layer) => neededIds.includes(layer.id));
  }, [allLayers]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(URL.revokeObjectURL);
    };
  }, [previewUrls]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const handleReset = () => {
    setHazardData({
      category: "",
      subcategory: "",
      description: "",
      date: formatDate(new Date()),
      media: [],
    });
    setHazardSubcategories([]);
    setActiveStep(0);
    setPreviewUrls([]);
  };

  const resetHazardLocalData = () => {
    setHazardData({
      category: "",
      subcategory: "",
      description: "",
      date: formatDate(new Date()),
      media: [],
    });
  };

  const handleHazardCategorySelect = async (
    layerName: string,
    layerUrl: string
  ) => {
    setHazardData((prev) => ({ ...prev, category: layerName }));

    const fetchedSubcategories = await getSubcategoriesFromHazardLayer(
      layerUrl
    );
    setHazardSubcategories(fetchedSubcategories);

    handleNext();
  };

  const handleHazardSubcategorySelect = (subcategory: string) => {
    setHazardData((prev) => ({ ...prev, subcategory }));
    handleNext();
  };

  async function getSubcategoriesFromHazardLayer(
    url: string
  ): Promise<{ name: string; code: string }[]> {
    try {
      const response = await esriRequest(url, {
        query: {
          f: "json",
        },
      });

      const fields = response.data.fields;
      const hazardSubcategoryField = fields.find(
        (field: any) => field.name === "Hazard_Subcategory"
      );

      if (
        hazardSubcategoryField &&
        hazardSubcategoryField.domain &&
        hazardSubcategoryField.domain.codedValues
      ) {
        return hazardSubcategoryField.domain.codedValues.map((cv: any) => ({
          name: cv.name,
          code: cv.code.toString(),
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      return [];
    }
  }

  const getHazardSubcategoryName = (code: string): string => {
    const hazardSubcategory = hazardSubcategories.find(
      (sub) => sub.code === code
    );
    return hazardSubcategory ? hazardSubcategory.name : code;
  };

  const handleSubmitHazard = async () => {
    onHazardDataChange(hazardData);
    onSubmitHazard(hazardData);
    resetHazardLocalData();
    handleNext();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            {hazardLayers.map((layer) => (
              <Grid item xs={6} sm={4} md={2.4} key={layer.id}>
                <Card
                  onClick={() =>
                    handleHazardCategorySelect(layer.name, layer.url)
                  }
                  sx={{
                    cursor: "pointer",
                    backgroundColor:
                      hazardData.category === layer.name ? "#e0e0e0" : "white",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      height: 140,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 2,
                      position: "relative",
                    }}
                  >
                    {!loadedHazardIcon[layer.name] && (
                      <CircularProgress
                        size={40}
                        sx={{
                          position: "absolute",
                        }}
                      />
                    )}
                    <CardMedia
                      component="img"
                      sx={{
                        width: "auto",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "100%",
                        objectFit: "contain",
                        opacity: loadedHazardIcon[layer.name] ? 1 : 0,
                        transition: "opacity 0.3s",
                      }}
                      image={`/images/icons/light-icons/${layer.name.replace(
                        / /g,
                        "_"
                      )}.svg`}
                      alt={layer.name}
                      onLoad={() => handleHazardIconLoad(layer.name)}
                    />
                  </Box>
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {layer.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            {hazardSubcategories.map((subcategory, index) => (
              <Grid item xs={6} sm={4} md={2.4} key={index}>
                <Card
                  onClick={() =>
                    handleHazardSubcategorySelect(subcategory.code)
                  }
                  sx={{
                    cursor: "pointer",
                    backgroundColor:
                      hazardData.subcategory === subcategory.name
                        ? "#e0e0e0"
                        : "white",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      height: 140,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 2,
                      position: "relative",
                    }}
                  >
                    {!loadedHazardIcon[subcategory.name] && (
                      <CircularProgress
                        size={40}
                        sx={{
                          position: "absolute",
                        }}
                      />
                    )}
                    <CardMedia
                      component="img"
                      sx={{
                        width: "auto",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "100%",
                        objectFit: "contain",
                        opacity: loadedHazardIcon[subcategory.name] ? 1 : 0,
                        transition: "opacity 0.3s",
                      }}
                      image={`/images/icons/light-icons/${subcategory.name.replace(
                        / /g,
                        "_"
                      )}.svg`}
                      alt={subcategory.name}
                      onLoad={() => handleHazardIconLoad(subcategory.name)}
                    />
                  </Box>
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {subcategory.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 2:
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Description (Optional)"
            placeholder="Write something about the hazard..."
            value={hazardData.description}
            InputLabelProps={{ shrink: true }}
            onChange={(e) => {
              const newText = e.target.value;
              if (newText.length <= MAX_DESCRIPTION_CHARS) {
                setHazardData((prev) => ({ ...prev, description: newText }));
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  style={{ alignSelf: "flex-end" }}
                >
                  <span style={{ color: "gray", fontSize: "0.75rem" }}>
                    {MAX_DESCRIPTION_CHARS - hazardData.description.length} /{" "}
                    {MAX_DESCRIPTION_CHARS} Characters
                  </span>
                </InputAdornment>
              ),
            }}
          />
        );

      case 3:
        return (
          <Box>
            {errorMessage && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  mb: 2,
                  p: 2,
                  bgcolor: "#FFEBEE",
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #FFCDD2",
                  borderRadius: 1,
                }}
              >
                <ErrorOutline color="error" sx={{ mr: 1 }} />
                <Typography variant="body2" color="error" sx={{ flexGrow: 1 }}>
                  {errorMessage}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setErrorMessage("")}
                  sx={{ ml: 1 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Paper>
            )}

            <input
              accept="image/*,video/*"
              style={{ display: "none" }}
              id="media-upload"
              multiple
              type="file"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const files = Array.from(e.target.files || []);
                const maxSize = 10 * 1024 * 1024;
                let errorFiles: string[] = [];
                let validFiles: File[] = [];

                files.forEach((file) => {
                  if (file.size >= maxSize) {
                    errorFiles.push(file.name);
                  } else {
                    validFiles.push(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setPreviewUrls((prev) => [
                        ...prev,
                        e.target?.result as string,
                      ]);
                    };
                    reader.readAsDataURL(file);
                  }
                });

                if (validFiles.length > 0) {
                  setHazardData((prev) => ({
                    ...prev,
                    media: [...prev.media, ...validFiles],
                  }));
                }

                if (errorFiles.length > 0) {
                  setErrorMessage(
                    `The following files exceed 10 MB and were not added: ${errorFiles.join(
                      ", "
                    )}`
                  );
                } else {
                  setErrorMessage("");
                }
              }}
            />

            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 3,
                position: "relative",
                minHeight: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <label
                htmlFor="media-upload"
                style={{ position: "absolute", top: 16, left: 16 }}
              >
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<AddPhotoAlternate />}
                  size="small"
                >
                  Add Images/Videos
                </Button>
              </label>

              {hazardData.media.length === 0 && (
                <>
                  <PhotoLibrary
                    sx={{ fontSize: 60, color: "text.secondary", mt: 4 }}
                  />
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    mt={2}
                    sx={{
                      fontSize: {
                        xs: "0.9rem",
                        sm: "1.2rem",
                        md: "1.2rem",
                        lg: "1.2rem",
                      },
                    }}
                  >
                    Add Images or Videos About the Hazard
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                    sx={{
                      fontSize: {
                        xs: "0.65rem",
                        sm: "0.85rem",
                        md: "0.85rem",
                        lg: "0.85rem",
                      },
                    }}
                  >
                    ( Each files' size must be bellow 10 MB )
                  </Typography>
                </>
              )}

              <Grid container spacing={2} sx={{ mt: 3 }}>
                {hazardData.media.map((file, index) => (
                  <Grid item xs={6} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        position: "relative",
                        height: "106px",
                        width: "100%",
                      }}
                    >
                      {file.type.startsWith("video") ? (
                        <Box
                          sx={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <video
                            src={URL.createObjectURL(file)}
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                            controls
                          />
                        </Box>
                      ) : (
                        <CardMedia
                          component="img"
                          image={URL.createObjectURL(file)}
                          alt={`Uploaded media ${index + 1}`}
                          sx={{ height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                          },
                        }}
                        onClick={() => {
                          setHazardData((prev) => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index),
                          }));
                          setPreviewUrls((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" align="center">
              Summary of the Report
            </Typography>

            <Grid
              container
              spacing={2}
              alignItems="center"
              style={{ marginTop: "0.5rem" }}
            >
              <Grid item xs={12} sm={5} md={5}>
                <Card
                  sx={{
                    backgroundColor: "white",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      height: 140,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 2,
                      position: "relative",
                    }}
                  >
                    {!loadedHazardIcon[hazardData.category] && (
                      <CircularProgress
                        size={40}
                        sx={{
                          position: "absolute",
                        }}
                      />
                    )}
                    <CardMedia
                      component="img"
                      sx={{
                        width: "auto",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "100%",
                        objectFit: "contain",
                        opacity: loadedHazardIcon[hazardData.category] ? 1 : 0,
                        transition: "opacity 0.3s",
                      }}
                      image={`/images/icons/light-icons/${hazardData.category.replace(
                        / /g,
                        "_"
                      )}.svg`}
                      alt={hazardData.category}
                      onLoad={() => handleHazardIconLoad(hazardData.category)}
                    />
                  </Box>
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {hazardData.category}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={2} md={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      width: "100%",
                      height: "2px",
                      backgroundColor: "",
                    }}
                  />
                  <ArrowForward
                    sx={{
                      fontSize: 50,
                      color: "black",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      padding: "4px",
                      zIndex: 1,
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={5} md={5}>
                <Card
                  sx={{
                    backgroundColor: "white",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      height: 140,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 2,
                      position: "relative",
                    }}
                  >
                    {!loadedHazardIcon[hazardData.subcategory] && (
                      <CircularProgress
                        size={40}
                        sx={{
                          position: "absolute",
                        }}
                      />
                    )}
                    <CardMedia
                      component="img"
                      sx={{
                        width: "auto",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "100%",
                        objectFit: "contain",
                        opacity: loadedHazardIcon[hazardData.subcategory]
                          ? 1
                          : 0,
                        transition: "opacity 0.3s",
                      }}
                      image={`/images/icons/light-icons/${getHazardSubcategoryName(
                        hazardData.subcategory
                      ).replace(/ /g, "_")}.svg`}
                      alt={getHazardSubcategoryName(hazardData.subcategory)}
                      onLoad={() =>
                        handleHazardIconLoad(hazardData.subcategory)
                      }
                    />
                  </Box>
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {getHazardSubcategoryName(hazardData.subcategory)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              label="Description (Editable)"
              placeholder="No Description Provided."
              value={hazardData.description}
              style={{ marginTop: "2rem", marginBottom: "1rem" }}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => {
                const newText = e.target.value;
                if (newText.length <= MAX_DESCRIPTION_CHARS) {
                  setHazardData((prev) => ({ ...prev, description: newText }));
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment
                    position="end"
                    style={{ alignSelf: "flex-end" }}
                  >
                    <span style={{ color: "gray", fontSize: "0.75rem" }}>
                      {MAX_DESCRIPTION_CHARS - hazardData.description.length} /{" "}
                      {MAX_DESCRIPTION_CHARS} Characters
                    </span>
                  </InputAdornment>
                ),
              }}
            />

            <hr
              className="border-none h-px my-4"
              style={{
                background:
                  "repeating-linear-gradient(to right, gray 0, gray 15px, transparent 15px, transparent 30px)",
              }}
            />

            <Typography sx={{ mb: 2 }}>
              Attached Media:{" "}
              {hazardData.media.length > 0
                ? `${hazardData.media.length} files`
                : ""}
            </Typography>

            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 3,
                position: "relative",
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {hazardData.media.length === 0 && (
                <>
                  <PhotoLibrary
                    sx={{ fontSize: 60, color: "text.secondary" }}
                  />
                  <Typography variant="body1" color="text.secondary" mt={2}>
                    No Media File Attached
                  </Typography>
                </>
              )}

              <Grid container spacing={2}>
                {hazardData.media.map((file, index) => (
                  <Grid item xs={6} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        position: "relative",
                        height: "106px",
                        width: "100%",
                      }}
                    >
                      {file.type.startsWith("video") ? (
                        <Box
                          sx={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <video
                            src={URL.createObjectURL(file)}
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                            controls
                          />
                        </Box>
                      ) : (
                        <CardMedia
                          component="img"
                          image={URL.createObjectURL(file)}
                          alt={`Uploaded media ${index + 1}`}
                          sx={{ height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                          },
                        }}
                        onClick={() => {
                          setHazardData((prev) => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index),
                          }));
                          setPreviewUrls((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        );

      case 5:
        return (
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: theme.palette.success.main,
                marginBottom: 2,
              }}
            >
              <Check style={{ fontSize: 60, color: "white" }} />
            </Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Thank You!
            </Typography>
            <Typography variant="h6">
              Your Hazard Report Submitted Successfully.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      {activeStep !== steps.length - 1 && (
        <DialogTitle>
          {activeStep !== 0 && (
            <IconButton
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{
                backgroundColor: "",
                "&:hover": {
                  backgroundColor: "grey.300",
                },
                width: 40,
                height: 40,
                mr: 2,
              }}
            >
              <ArrowBack sx={{ color: "grey.600" }} />
            </IconButton>
          )}

          {getStepTitle(activeStep)}

          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent>
        {activeStep !== steps.length - 1 && (
          <>
            <ResponsiveStepper activeStep={activeStep}>
              {steps.map((label, index) => (
                <Step
                  key={label}
                  className={activeStep === index ? "active" : ""}
                >
                  <StepLabel>
                    {isCompact ? `Step ${index + 1}: ${label}` : label}
                  </StepLabel>
                </Step>
              ))}
            </ResponsiveStepper>

            {isCompact && (
              <Typography
                variant="caption"
                sx={{ mt: 1, display: "block", textAlign: "center" }}
              >
                Step {activeStep + 1} of {steps.length}
              </Typography>
            )}
          </>
        )}

        <Box mt={4}>
          {activeStep === steps.length ? (
            <Box>
              <Typography>
                All steps completed - you&apos;re finished
              </Typography>
              <Button onClick={handleReset} startIcon={<ArrowBack />}>
                Reset
              </Button>
            </Box>
          ) : (
            <Box>
              {renderStepContent(activeStep)}
              <Box
                mt={4}
                display="flex"
                justifyContent={
                  activeStep === steps.length - 1 ? "center" : "space-between"
                }
              >
                {activeStep !== 0 && activeStep !== steps.length - 1 && (
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                  >
                    Back
                  </Button>
                )}
                {activeStep > 1 &&
                  (activeStep === steps.length - 2 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitHazard}
                      endIcon={<Send />}
                    >
                      Submit Hazard
                    </Button>
                  ) : activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onClose}
                    >
                      OK
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      endIcon={<ArrowForward />}
                    >
                      Next
                    </Button>
                  ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddHazardModal;
